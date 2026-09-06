import { useTransactions } from '../hooks/useTransactions';
import './DashboardSummary.css';

export function DashboardSummary({ selectedMonths }: { selectedMonths: Set<number> }) {
    const { data: transactions, isLoading } = useTransactions();
    
    if (isLoading) {
        return (
            <div className="dashboard-summary-loading">
                <span className="dashboard-summary-loading-text">Loading...</span>
            </div>
        );
    }
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    let totalKrw = 0;
    let totalPhp = 0;
    
    transactions?.forEach(t => {
        const d = new Date(t.transacted_at);
        // Only include if no months selected (show all) OR if the month is in selectedMonths
        if (selectedMonths.size === 0 || selectedMonths.has(d.getMonth())) {
            // Also restrict to current year for now, or allow all years if that's preferred?
            // The prompt says "Jan to December", assuming current year.
            if (d.getFullYear() === currentYear) {
                totalKrw += t.krw_amount || 0;
                totalPhp += t.php_amount || 0;
            }
        }
    });

    return (
        <div className="dashboard-summary-container">
            <div className="dashboard-summary-bg-circle"></div>
            
            <h2 className="dashboard-summary-title">
                Total Spent
            </h2>
            <div className="dashboard-summary-content">
                <span className="dashboard-summary-krw">
                    ₩{totalKrw.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="dashboard-summary-php">
                    ₱{totalPhp.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
}
