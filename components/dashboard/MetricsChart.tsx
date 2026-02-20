// ============================================================================
// Metrics Chart — Client component using Recharts
// Renders a line chart of mental health metrics over time
// ============================================================================

"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface MetricsChartProps {
    data: {
        date: string;
        mental_health: number;
        happiness: number;
        accountability: number;
        stress: number;
        burnout_risk: number;
    }[];
}

export default function MetricsChart({ data }: MetricsChartProps) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                />
                <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="mental_health"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    name="Mental Health"
                />
                <Line
                    type="monotone"
                    dataKey="happiness"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Happiness"
                />
                <Line
                    type="monotone"
                    dataKey="accountability"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Accountability"
                />
                <Line
                    type="monotone"
                    dataKey="stress"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Stress"
                />
                <Line
                    type="monotone"
                    dataKey="burnout_risk"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    name="Burnout Risk"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
