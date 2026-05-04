interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: "blue" | "green" | "yellow" | "red" | "purple";
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
}: StatsCardProps) {
  const colorClasses = {
    blue: "text-blue-700",
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
    purple: "text-purple-700",
  };

  return (
    <div className="bg-light-black rounded-lg shadow px-6 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white mb-4">{title}</p>
          <p className="mt-2 text-3xl font-medium text-gray-100">{value}</p>
          {trend && (
            <p
              className={`mt-2 text-sm ${
                trend.positive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
