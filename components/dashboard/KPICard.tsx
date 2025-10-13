import { Card, CardBody } from "@heroui/react";
import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "success" | "danger" | "warning" | "default";
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function KPICard({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  trend,
}: KPICardProps) {
  const colorClasses = {
    primary: "from-primary-50 to-primary-100 border-primary-200",
    success: "from-success-50 to-success-100 border-success-200",
    danger: "from-danger-50 to-danger-100 border-danger-200",
    warning: "from-warning-50 to-warning-100 border-warning-200",
    default: "from-default-50 to-default-100 border-default-200",
  };

  const iconColorClasses = {
    primary: "text-primary-600",
    success: "text-success-600",
    danger: "text-danger-600",
    warning: "text-warning-600",
    default: "text-default-600",
  };

  const textColorClasses = {
    primary: "text-primary-700",
    success: "text-success-700",
    danger: "text-danger-700",
    warning: "text-warning-700",
    default: "text-default-700",
  };

  const subtitleColorClasses = {
    primary: "text-primary-600",
    success: "text-success-600",
    danger: "text-danger-600",
    warning: "text-warning-600",
    default: "text-default-600",
  };

  return (
    <Card
      className={`bg-gradient-to-br ${colorClasses[color]} border-2 hover:scale-105 transition-transform`}
    >
      <CardBody className="text-center py-6">
        <div className={`${iconColorClasses[color]} mx-auto mb-3`}>{icon}</div>
        <p className={`text-3xl font-bold ${textColorClasses[color]} mb-1`}>
          {value}
        </p>
        <p className={`text-sm ${subtitleColorClasses[color]} font-medium`}>
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-default-500 mt-1">{subtitle}</p>
        )}
        {trend && (
          <p
            className={`text-xs mt-2 font-semibold ${
              trend.isPositive ? "text-success-600" : "text-danger-600"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
          </p>
        )}
      </CardBody>
    </Card>
  );
}
