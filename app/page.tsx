"use client";

import { useState, useRef, useEffect } from "react";
import StatsTab from "@/components/StatsTab";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Wallet,
  Timer,
  Zap,
  Fuel,
  Coffee,
  TrendingUp,
  Target,
  Plus,
  Trash2,
  Send,
  Settings,
  Bike,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { useAppletData } from "@/lib/firebase-hooks";
import { DailySummary } from "@/lib/db";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/components/FirebaseProvider";

const formatCurrency = (val: number) => `₫${val.toLocaleString("vi-VN")}`;

const Card = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-card border border-border rounded-xl p-4 shadow-sm",
      className,
    )}
  >
    {children}
  </div>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionTarget, setSessionTarget] = useState(0);
  const [newTripRevenue, setNewTripRevenue] = useState("");
  const { user } = useAuth();

  const {
    summary,
    sessions,
    settings,
    calculated,
    isLoading,
    updateSummary,
    addTrip,
    addSession,
    deleteSession,
    updateSettings,
  } = useAppletData(date);

  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  const handleUpdateSummaryLocal = (updates: Partial<DailySummary>) => {
    updateSummary(updates);
  };

  const handleAddTrip = async () => {
    if (!newTripRevenue) return;
    const rev = Number(newTripRevenue);
    if (isNaN(rev) || rev <= 0) return;
    await addTrip(rev);
    setNewTripRevenue("");
  };

  const triggerFireworks = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
    };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        }),
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        }),
      );
    }, 250);
  };

  const handleUpdateSettingLocal = async () => {
    try {
      await updateSettings(settings);
      alert("Đã lưu cài đặt");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu");
    }
  };

  const handleAddSession = async () => {
    const start = startTimeRef.current?.value;
    const end = endTimeRef.current?.value;
    if (!start || !end) {
      alert("Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc");
      return;
    }
    try {
      await addSession(start, end, sessionTarget);
      if (startTimeRef.current) {
        const now = new Date();
        startTimeRef.current.value = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      }
      if (endTimeRef.current) endTimeRef.current.value = "";
      setSessionTarget(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (
      calculated.currentSessionTarget > 0 &&
      calculated.currentSessionRevenue >= calculated.currentSessionTarget
    ) {
      triggerFireworks();
    }
  }, [calculated.currentSessionRevenue, calculated.currentSessionTarget]);

  const sendDiscordReport = async () => {
    try {
      const res = await fetch("/api/send-discord-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, uid: user?.uid }),
      });
      const data = await res.json();
      if (data.error) alert(`Lỗi: ${data.error}`);
      else alert("Đã gửi báo cáo lên Discord thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối");
    }
  };

  return (
    <div className="pb-20 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <Bike className="w-5 h-5 text-accent" />
          Huy ơi !
        </h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-card border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-accent"
        />
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-card rounded-xl w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-24 bg-card rounded-xl w-full"></div>
              <div className="h-24 bg-card rounded-xl w-full"></div>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Profit Card */}
                <Card className="bg-gradient-to-br from-accent/20 to-card border-accent/30 flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-sm text-gray-400 mb-1">
                    Lợi nhuận thực nhận
                  </span>
                  <div className="text-4xl font-bold text-accent mb-2">
                    {formatCurrency(calculated?.profit || 0)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Doanh thu: {formatCurrency(summary?.revenue || 0)}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
                      Chi phí: {formatCurrency(calculated?.totalCost || 0)}
                    </div>
                  </div>
                </Card>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <Activity className="w-4 h-4" /> Số đơn
                    </div>
                    <div className="text-2xl font-semibold">
                      {summary?.orders || 0}
                    </div>
                  </Card>
                  <Card>
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <Timer className="w-4 h-4" /> Thời gian chạy
                    </div>
                    <div className="text-2xl font-semibold">
                      {(calculated?.totalHours || 0).toFixed(1)}h
                    </div>
                  </Card>
                  <Card>
                    <div
                      className="flex items-center gap-2 text-gray-400 text-sm mb-2"
                      title="Doanh thu trung bình mỗi giờ = Tổng doanh thu / Tổng giờ chạy"
                    >
                      <Zap className="w-4 h-4 cursor-help" />
                      <span className="cursor-help border-b border-dashed border-gray-500">
                        DT / Giờ
                      </span>
                    </div>
                    <div className="text-2xl font-semibold">
                      {formatCurrency(
                        Math.round(calculated?.revenuePerHour || 0),
                      )}
                    </div>
                  </Card>
                  <Card>
                    <div
                      className="flex items-center gap-2 text-gray-400 text-sm mb-2"
                      title="Lợi nhuận thực tế mỗi giờ = (Tổng doanh thu - Tiền xăng) / Tổng giờ chạy"
                    >
                      <Calculator className="w-4 h-4 cursor-help" />
                      <span className="cursor-help border-b border-dashed border-gray-500">
                        LN / Giờ
                      </span>
                    </div>
                    <div className="text-2xl font-semibold">
                      {formatCurrency(
                        Math.round(calculated?.profitPerHour || 0),
                      )}
                    </div>
                  </Card>
                </div>

                {/* Target Progress - Ca hiện tại */}
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Target className="w-5 h-5 text-accent" /> Mục tiêu ca
                    </div>
                    <div className="flex items-center gap-2">
                      {calculated.currentSessionRevenue >
                        calculated.currentSessionTarget &&
                        calculated.currentSessionTarget > 0 && (
                          <span className="text-xs text-green-500 font-medium">
                            Vượt:{" "}
                            {formatCurrency(
                              calculated.currentSessionRevenue -
                                calculated.currentSessionTarget,
                            )}
                          </span>
                        )}
                      <span className="text-sm font-semibold">
                        {formatCurrency(calculated.currentSessionRevenue)} /{" "}
                        {formatCurrency(calculated.currentSessionTarget)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-border rounded-full h-2.5 mb-1">
                    <motion.div
                      className="bg-accent h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(calculated.currentSessionPercent, 100)}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mb-3">
                    {Number(calculated.currentSessionPercent).toFixed(0)}%
                  </div>
                </Card>

                {/* Quick Inputs */}
                <div className="space-y-4">
                  <h3 className="font-semibold px-1">Cập nhật nhanh</h3>

                  <Card className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Lợi nhuận đơn này</span>
                      <span className="text-accent">
                        {summary?.orders || 0} đơn
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={
                          newTripRevenue
                            ? Number(newTripRevenue).toLocaleString("vi-VN")
                            : ""
                        }
                        onChange={(e) =>
                          setNewTripRevenue(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Lợi nhuận đơn này (VD: 35.000)"
                        className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none"
                        inputMode="numeric"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTrip();
                        }}
                      />
                      <button
                        onClick={handleAddTrip}
                        className="bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/80 transition text-sm font-medium flex-shrink-0 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pt-2 mt-2 border-t border-border/50 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Sửa tổng doanh thu
                        </label>
                        <input
                          type="text"
                          value={
                            summary?.revenue !== undefined
                              ? Number(summary.revenue).toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateSummaryLocal({
                              revenue: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          onBlur={(e) =>
                            updateSummary({
                              revenue: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none text-gray-400"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Sửa tổng số đơn
                        </label>
                        <input
                          type="text"
                          value={
                            summary?.orders !== undefined
                              ? Number(summary.orders).toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateSummaryLocal({
                              orders: Number(e.target.value.replace(/\D/g, "")),
                            })
                          }
                          onBlur={(e) =>
                            updateSummary({
                              orders: Number(e.target.value.replace(/\D/g, "")),
                            })
                          }
                          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-accent outline-none text-gray-400"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Chi phí hoạt động</span>
                      <span>{formatCurrency(calculated?.totalCost || 0)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Fuel className="w-3 h-3" /> Xăng
                        </label>
                        <input
                          type="text"
                          value={
                            summary?.fuelCost !== undefined
                              ? Number(summary.fuelCost).toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateSummaryLocal({
                              fuelCost: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          onBlur={(e) =>
                            updateSummary({
                              fuelCost: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          className="w-full bg-background border border-border rounded-md px-2 py-2 text-sm focus:border-accent outline-none"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <Coffee className="w-3 h-3" /> Ăn uống
                        </label>
                        <input
                          type="text"
                          value={
                            summary?.foodCost !== undefined
                              ? Number(summary.foodCost).toLocaleString("vi-VN")
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateSummaryLocal({
                              foodCost: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          onBlur={(e) =>
                            updateSummary({
                              foodCost: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          className="w-full bg-background border border-border rounded-md px-2 py-2 text-sm focus:border-accent outline-none"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Khác
                        </label>
                        <input
                          type="text"
                          value={
                            summary?.otherCost !== undefined
                              ? Number(summary.otherCost).toLocaleString(
                                  "vi-VN",
                                )
                              : ""
                          }
                          onChange={(e) =>
                            handleUpdateSummaryLocal({
                              otherCost: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          onBlur={(e) =>
                            updateSummary({
                              otherCost: Number(
                                e.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          className="w-full bg-background border border-border rounded-md px-2 py-2 text-sm focus:border-accent outline-none"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Work Sessions */}
                <Card className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Timer className="w-5 h-5 text-accent" /> Ca làm việc
                  </h3>

                  {sessions.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-4">
                      Chưa có ca làm việc nào
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((s) => {
                        let durationStr = "";
                        if (s.startTime && s.endTime) {
                          const [sh, sm] = s.startTime.split(":").map(Number);
                          const [eh, em] = s.endTime.split(":").map(Number);
                          let mins = eh * 60 + em - (sh * 60 + sm);
                          if (mins < 0) mins += 24 * 60;
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          if (h > 0 && m > 0) durationStr = `${h}h${m}p`;
                          else if (h > 0) durationStr = `${h}h`;
                          else durationStr = `${m}p`;
                        }

                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between bg-background p-2 px-3 rounded-md border border-border"
                          >
                            <div className="text-sm">
                              <span>
                                {s.startTime} - {s.endTime}
                              </span>
                              {s.targetRevenue ? (
                                <span className="ml-2 text-xs text-accent">
                                  MT: {formatCurrency(s.targetRevenue)}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              {durationStr && (
                                <span className="text-xs text-gray-500 bg-border/50 px-2 py-0.5 rounded-full">
                                  {durationStr}
                                </span>
                              )}
                              <ConfirmDialog
                                trigger={
                                  <button className="text-red-400 hover:bg-red-400/10 p-1 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                }
                                title="Xóa ca làm việc"
                                description="Ca làm việc này sẽ bị xóa vĩnh viễn. Bạn có chắc không?"
                                confirmLabel="Xóa"
                                cancelLabel="Hủy"
                                onConfirm={() => deleteSession(s.id!)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border flex-wrap">
                    <input
                      type="time"
                      ref={startTimeRef}
                      defaultValue={`${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")}`}
                      className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      ref={endTimeRef}
                      className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none"
                    />
                    <select
                      value={sessionTarget}
                      onChange={(e) => setSessionTarget(Number(e.target.value))}
                      className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm outline-none"
                    >
                      <option value="0">Mục tiêu ca...</option>
                      <option value="100000">100k</option>
                      <option value="150000">150k</option>
                      <option value="200000">200k</option>
                      <option value="250000">250k</option>
                      <option value="300000">300k</option>
                      <option value="400000">400k</option>
                      <option value="450000">450k</option>
                      <option value="500000">500k</option>
                    </select>
                    <button
                      onClick={handleAddSession}
                      className="bg-accent text-white p-2 rounded-md hover:bg-accent/80 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <StatsTab />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Card className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#5865F2]" /> Discord
                    Integration
                  </h3>
                  <p className="text-sm text-gray-400">
                    Nhập Webhook URL của Discord để nhận báo cáo do bạn yêu cầu
                    mỗi cuối ngày.
                  </p>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Webhook URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://discord.com/api/webhooks/..."
                      value={settings.discordWebhook}
                      onChange={(e) =>
                        updateSettings({
                          ...settings,
                          discordWebhook: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-[#5865F2] outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleUpdateSettingLocal}
                      className="flex-1 bg-card border border-border hover:bg-border transition rounded-md py-2 text-sm font-medium"
                    >
                      Lưu cài đặt
                    </button>
                    <button
                      onClick={sendDiscordReport}
                      className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] text-white transition rounded-md py-2 text-sm font-medium flex justify-center items-center gap-1"
                    >
                      <Send className="w-4 h-4" /> Gửi báo cáo Text
                    </button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-2 flex items-center justify-between pb-safe z-50">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[64px]",
            activeTab === "dashboard"
              ? "text-accent"
              : "text-gray-500 hover:text-gray-300",
          )}
        >
          <Activity className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase font-semibold">Theo dõi</span>
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[64px]",
            activeTab === "stats"
              ? "text-accent"
              : "text-gray-500 hover:text-gray-300",
          )}
        >
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase font-semibold">Thống kê</span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[64px]",
            activeTab === "settings"
              ? "text-accent"
              : "text-gray-500 hover:text-gray-300",
          )}
        >
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase font-semibold">Cài đặt</span>
        </button>
      </nav>
    </div>
  );
}
