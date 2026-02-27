import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Check, X } from "lucide-react";

export default function PlanCard({ plan, featuresList = [], onEdit, onDelete }) {
  // find price for default interval
  const defaultInterval = plan.defaultInterval || (plan.prices?.[0]?.interval ?? "month");
  const priceObj = Array.isArray(plan.prices)
    ? plan.prices.find((p) => p.interval === defaultInterval) || plan.prices[0]
    : null;

  const priceDisplay = priceObj ? `${priceObj.amount ?? 0}` : (plan.price ?? 0);

  const getFeatureLabel = (key) => {
    const f = featuresList.find((x) => x.key === key);
    return f ? f.label : key;
  };

  return (
    <Card className="rounded-xl border shadow-sm hover:shadow-md transition bg-white">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="font-semibold text-gray-800">{plan.name}</span>
          <span className="text-indigo-600 font-semibold">${priceDisplay}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="text-sm text-gray-700 space-y-2">
        <p><strong>Key:</strong> {plan.key}</p>
        <p><strong>Default Interval:</strong> {plan.defaultInterval || "month"}</p>

        {plan.isFree && (
          <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Free Plan</span>
        )}

        <hr className="my-2" />

        <p className="font-medium">Features:</p>
        <ul className="list-disc list-inside space-y-1">
          {plan.features?.length ? (
            plan.features.map((f, i) => {
              // feature object may be { key, value } or { featureKey, value }
              const featureKey = f.key || f.featureKey || f.feature?.key;
              const raw = f.value ?? f.val ?? f.total ?? "";
              const normalized = raw === true || raw === "true" || raw === 1 || raw === "1" || raw === "yes";
              const isBoolean = typeof raw === "boolean" || raw === "true" || raw === "false" || raw === "1" || raw === "0" || raw === 1 || raw === 0;

              return (
                <li key={i} className="flex items-center gap-2">
                  <span className="font-medium break-words">{getFeatureLabel(featureKey)}:</span>
                  {isBoolean ? (
                    normalized ? <Check className="text-green-600 h-4 w-4" /> : <X className="text-red-500 h-4 w-4" />
                  ) : (
                    <span>{String(raw)}</span>
                  )}
                </li>
              );
            })
          ) : (
            <li className="text-gray-400 text-sm">No features assigned</li>
          )}
        </ul>

        <div className="flex justify-end gap-2 pt-3">
          <Button size="sm" variant="outline" onClick={() => onEdit(plan)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(plan._id || plan.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}
