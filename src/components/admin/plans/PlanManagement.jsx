import React, { useEffect, useState, useRef } from "react";
import api from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { showSuccess, showError } from "../../shared/Toast";
import LoadingSpinner from "../../shared/LoadingSpinner";
import PlanCard from "./PlanCard";
import FeatureManager from "./FeatureManager";

export default function PlanManagement() {
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    prices: [
      { interval: "month", amount: 0, stripePriceId: "" },
      { interval: "year", amount: 0, stripePriceId: "" },
    ],
    defaultInterval: "month",
    isFree: false,
    features: [],
  });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const planFormRef = useRef(null);

  useEffect(() => {
    fetchFeaturesAndPlans();
  }, []);

  const normalizeFeaturesResp = (res) =>
    res?.data?.data || res?.data?.features || res?.features || res?.data || [];

  const normalizePlansResp = (res) =>
    res?.data?.plans || res?.plans || res?.data?.data || res?.data || [];

  const fetchFeaturesAndPlans = async () => {
    try {
      setLoading(true);
      const [featuresRes, plansRes] = await Promise.all([
        api.get("/admin/features"),
        api.get("/admin/plans"),
      ]);

      setFeatures(normalizeFeaturesResp(featuresRes));
      setPlans(normalizePlansResp(plansRes));
    } catch (err) {
      console.error(err);
      showError("Failed to load plans or features");
    } finally {
      setLoading(false);
    }
  };

  const ensurePriceEntry = (prices, interval) => {
    const copy = Array.isArray(prices) ? [...prices] : [];
    if (!copy.find((p) => p.interval === interval)) {
      copy.push({ interval, amount: 0, stripePriceId: "" });
    }
    return copy;
  };

  const handleSave = async () => {
    if (!form.name || !form.key)
      return showError("Plan name and key are required");

    const payload = {
      name: form.name,
      key: form.key,
      description: form.description,
      prices: ensurePriceEntry(form.prices, "month"),
      defaultInterval: form.defaultInterval,
      isFree: !!form.isFree,
      features: form.features.map((f) => ({
        key: f.key,
        value: f.value,
      })),
    };

    try {
      if (editing) {
        await api.put(`/admin/plans/${editing}`, payload);
        showSuccess("Plan updated successfully");
      } else {
        await api.post("/admin/plans", payload);
        showSuccess("Plan created successfully");
      }
      resetForm();
      fetchFeaturesAndPlans();
    } catch (err) {
      console.error(err);
      showError("Failed to save plan");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      showSuccess("Plan deleted");
      fetchFeaturesAndPlans();
    } catch (err) {
      console.error(err);
      showError("Failed to delete plan");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      key: "",
      description: "",
      prices: [
        { interval: "month", amount: 0, stripePriceId: "" },
        { interval: "year", amount: 0, stripePriceId: "" },
      ],
      defaultInterval: "month",
      isFree: false,
      features: [],
    });
    setEditing(null);
  };

  const handleFeatureUpdate = async () => {
    await fetchFeaturesAndPlans();
  };

  const scrollToPlanForm = () => {
    if (planFormRef.current) {
      requestAnimationFrame(() => {
        planFormRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) return <LoadingSpinner text="Loading plans..." />;

  return (
    <div className="space-y-10 p-4">

      {/* ========== 1️⃣ FEATURE MANAGER FIRST ========== */}
      <FeatureManager onFeatureUpdate={handleFeatureUpdate} />

      {/* ========== 2️⃣ PLAN CREATION FORM ========== */}
      <Card ref={planFormRef} className="shadow-md" id="plan-form-card">
        <CardHeader>
          <CardTitle>
            {editing ? "Edit Plan" : "Create New Plan"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Plan Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              placeholder="Plan Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Unique Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
            <Input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              placeholder="Monthly Price (USD)"
              type="number"
              value={form.prices.find((p) => p.interval === "month")?.amount ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setForm((prev) => {
                  const prices = ensurePriceEntry(prev.prices, "month").map((p) =>
                    p.interval === "month" ? { ...p, amount: val } : p
                  );
                  return { ...prev, prices };
                });
              }}
            />
            <Input
              placeholder="Monthly Stripe Price ID"
              value={form.prices.find((p) => p.interval === "month")?.stripePriceId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => {
                  const prices = ensurePriceEntry(prev.prices, "month").map((p) =>
                    p.interval === "month" ? { ...p, stripePriceId: val } : p
                  );
                  return { ...prev, prices };
                });
              }}
            />
            <Input
              placeholder="Yearly Price (USD)"
              type="number"
              value={form.prices.find((p) => p.interval === "year")?.amount ?? ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setForm((prev) => {
                  const prices = ensurePriceEntry(prev.prices, "year").map((p) =>
                    p.interval === "year" ? { ...p, amount: val } : p
                  );
                  return { ...prev, prices };
                });
              }}
            />
            <Input
              placeholder="Yearly Stripe Price ID"
              value={form.prices.find((p) => p.interval === "year")?.stripePriceId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => {
                  const prices = ensurePriceEntry(prev.prices, "year").map((p) =>
                    p.interval === "year" ? { ...p, stripePriceId: val } : p
                  );
                  return { ...prev, prices };
                });
              }}
            />
            <select
              value={form.defaultInterval}
              onChange={(e) =>
                setForm({ ...form, defaultInterval: e.target.value })
              }
              className="border rounded p-2"
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) =>
                  setForm({ ...form, isFree: e.target.checked })
                }
              />
              Mark as Free Plan
            </label>
          </div>

          {/* Feature Configuration */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-medium text-gray-700">
              Feature Configuration
            </h3>
            {features.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No features found. Please create features above.
              </p>
            ) : (
              features.map((f) => {
                const existing = form.features.find((x) => x.key === f.key);
                const value = existing ? existing.value : (f.type === "bool" ? false : "");

                return (
                  <div
                    key={f._id || f.key}
                    className="flex items-center justify-between border rounded p-2 bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-500">Type: {f.type}</p>
                    </div>

                    {f.type === "bool" ? (
                      <select
                        className="border rounded p-1 text-sm"
                        value={value ? "true" : "false"}
                        onChange={(e) => {
                          const val = e.target.value === "true";
                          setForm((prev) => ({
                            ...prev,
                            features: [
                              ...prev.features.filter((x) => x.key !== f.key),
                              { key: f.key, value: val },
                            ],
                          }));
                        }}
                      >
                        <option value="true">✅ Yes</option>
                        <option value="false">❌ No</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        className="border rounded p-1 w-32 text-sm"
                        value={value}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            features: [
                              ...prev.features.filter((x) => x.key !== f.key),
                              { key: f.key, value: val },
                            ],
                          }));
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========== 3️⃣ PLAN LIST ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan._id || plan.id}
            plan={plan}
            featuresList={features}
            onEdit={(p) => {
              setEditing(p._id || p.id);
              setForm({
                name: p.name,
                key: p.key,
                description: p.description,
                prices: p.prices || [],
                defaultInterval: p.defaultInterval,
                isFree: !!p.isFree,
                features:
                  p.features?.map((f) => ({
                    key: f.key || f.featureKey || f.feature?.key,
                    value: f.value,
                  })) || [],
              });
              scrollToPlanForm(); // ✅ Auto-scroll to top form on edit
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
