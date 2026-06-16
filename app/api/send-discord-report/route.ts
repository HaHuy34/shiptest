import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Init Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminDb = getFirestore();

const formatCurrency = (val: number) => `₫${val.toLocaleString("vi-VN")}`;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(request: Request) {
  try {
    const { date, uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    // Lấy settings
    const settingsSnap = await adminDb.doc(`users/${uid}/settings/main`).get();
    const settings = settingsSnap.data();
    const webhook =
      settings?.discordWebhook ||
      "https://discord.com/api/webhooks/1516278805067595907/C8X7cQ5VZOdfY3sVyWNACxUCbIcyWfYcg2UtNggW_VgyIMNGw-H8VIi66029ReLCm8v-";

    if (!webhook) {
      return NextResponse.json(
        { error: "Chưa cấu hình Discord Webhook" },
        { status: 400 },
      );
    }

    // Lấy summary
    const summarySnap = await adminDb
      .doc(`users/${uid}/dailySummaries/${date}`)
      .get();

    if (!summarySnap.exists) {
      return NextResponse.json(
        { error: "Không có dữ liệu ngày này" },
        { status: 404 },
      );
    }

    const summary = summarySnap.data()!;

    // Lấy sessions
    const sessionsSnap = await adminDb
      .collection(`users/${uid}/dailySummaries/${date}/sessions`)
      .orderBy("startTime", "asc")
      .get();

    let totalMinutes = 0;
    const sessionLines: string[] = [];

    for (const s of sessionsSnap.docs) {
      const data = s.data();
      if (data.startTime && data.endTime) {
        const start = timeToMinutes(data.startTime);
        const end = timeToMinutes(data.endTime);
        let mins = end - start;
        if (mins < 0) mins += 24 * 60;
        totalMinutes += mins;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const dur = h > 0 && m > 0 ? `${h}h${m}p` : h > 0 ? `${h}h` : `${m}p`;
        const target = data.targetRevenue
          ? ` | MT: ${formatCurrency(data.targetRevenue)}`
          : "";
        sessionLines.push(
          `• ${data.startTime} - ${data.endTime} (${dur})${target}`,
        );
      }
    }

    const totalHours = totalMinutes / 60;
    const totalCost =
      (summary.fuelCost || 0) +
      (summary.foodCost || 0) +
      (summary.otherCost || 0);
    const profit = (summary.revenue || 0) - totalCost;
    const revenuePerHour =
      totalHours > 0 ? (summary.revenue || 0) / totalHours : 0;
    const profitPerHour = totalHours > 0 ? profit / totalHours : 0;
    const completionPercent =
      (summary.targetRevenue || 0) > 0
        ? (profit / summary.targetRevenue) * 100
        : 0;

    const embed = {
      title: `📊 BÁO CÁO NGÀY ${date}`,
      color: 0x8b5cf6,
      fields: [
        {
          name: "💰 Doanh thu",
          value: formatCurrency(summary.revenue || 0),
          inline: true,
        },
        {
          name: "📦 Số đơn",
          value: `${summary.orders || 0} đơn`,
          inline: true,
        },
        {
          name: "✅ Lợi nhuận",
          value: formatCurrency(profit),
          inline: true,
        },
        {
          name: "⏱️ Tổng giờ chạy",
          value: `${totalHours.toFixed(1)} giờ`,
          inline: true,
        },
        {
          name: "🚀 DT / Giờ",
          value: formatCurrency(Math.round(revenuePerHour)),
          inline: true,
        },
        {
          name: "💹 LN / Giờ",
          value: formatCurrency(Math.round(profitPerHour)),
          inline: true,
        },
        {
          name: "⛽ Xăng",
          value: formatCurrency(summary.fuelCost || 0),
          inline: true,
        },
        {
          name: "🍜 Ăn uống",
          value: formatCurrency(summary.foodCost || 0),
          inline: true,
        },
        {
          name: "📦 Chi phí khác",
          value: formatCurrency(summary.otherCost || 0),
          inline: true,
        },
        {
          name: "💸 Tổng chi phí",
          value: formatCurrency(totalCost),
          inline: true,
        },
        {
          name: "🎯 Mục tiêu ngày",
          value: formatCurrency(summary.targetRevenue || 0),
          inline: true,
        },
        {
          name: "📈 % Hoàn thành",
          value: `${completionPercent.toFixed(1)}%`,
          inline: true,
        },
        ...(sessionLines.length > 0
          ? [
              {
                name: "🕐 Ca làm việc",
                value: sessionLines.join("\n"),
                inline: false,
              },
            ]
          : []),
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "Huy ơi ! 🏍️" },
    };

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      throw new Error("Discord API Error");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi gửi báo cáo" }, { status: 500 });
  }
}
