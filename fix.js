const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf-8');

// Replace updateSummary with handleUpdateSummary where they were called directly on events
code = code.replace(/updateSummary\(\{/g, 'handleUpdateSummary({');

// Replace setSummary with setSummaryLocal so onChange handlers work again
code = code.replace(/setSummary\(/g, 'setSummaryLocal(');

// Use summaryLocal instead of summary for inputs, but keep summary for the initial state calculation (actually we can just swap them conditionally or sync them)
code = code.replace(/summary\?\./g, '(summaryLocal || summary)?.');

// We need to inject the declaration of summaryLocal
const newDeclaration = `
  const [summaryLocal, setSummaryLocal] = useState<DailySummary | null>(null);
  
  useEffect(() => {
    setSummaryLocal(summary);
  }, [summary]);
`;

code = code.replace('  // Form states', newDeclaration + '\n  // Form states');

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed page.tsx');
