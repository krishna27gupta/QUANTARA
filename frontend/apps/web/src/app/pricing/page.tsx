"use client";

import { Check, Sparkles } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      description: "Basic quantitative insights and standard web access",
      features: [
        "10 stock calculations per day",
        "Standard latency analytics",
        "Community forum support",
        "1 active portfolio connection",
      ],
      popular: false,
      cta: "Get Started",
    },
    {
      name: "Pro",
      price: "$49",
      description: "Advanced ML models and institutional grade analysis",
      features: [
        "Unlimited stock calculations",
        "High-frequency model predictions",
        "Priority AI assistant chat support",
        "Up to 10 active portfolio integrations",
        "Custom email alerts & reports",
      ],
      popular: true,
      cta: "Upgrade to Pro",
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Dedicated resources and fine-tuned AI neural nodes",
      features: [
        "Dedicated API compute endpoints",
        "Custom ML models fine-tuning",
        "24/7 designated account managers",
        "Unlimited connections & historical backtesting",
      ],
      popular: false,
      cta: "Contact Sales",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2 py-4">
        <h2 className="text-2xl font-bold tracking-tight">Flexible Startup Pricing</h2>
        <p className="text-sm text-muted-foreground">
          Deploy Quantara in production and scale computational stock analytics seamlessly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl bg-card border flex flex-col justify-between relative hover:shadow-lg transition-all ${
              plan.popular 
                ? "border-primary shadow-md scale-105 md:translate-y-[-8px] bg-gradient-to-b from-card to-primary/5" 
                : "border-border"
            }`}
          >
            {plan.popular && (
              <span className="absolute top-0 right-1/2 translate-x-1/2 translate-y-[-50%] bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                POPULAR
              </span>
            )}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              </div>
              <div className="py-2">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-xs text-muted-foreground">/month</span>}
              </div>
              <ul className="space-y-2.5 text-sm pt-2">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90 text-xs">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-6">
              <button
                className={`w-full py-2.5 rounded-xl text-xs font-semibold select-none transition-colors cursor-pointer text-center ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/95"
                    : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
