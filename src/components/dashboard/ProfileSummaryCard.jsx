import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/* ---------- Modern Ring Analog Clock ---------- */
function RingClock({ timeZone, label, color }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const localTime = new Date(now.toLocaleString("en-US", { timeZone }));
  const hours = localTime.getHours();
  const minutes = localTime.getMinutes();
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6;
  const period = hours >= 12 ? "pm" : "am";

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-12 w-12 rounded-full bg-surface flex items-center justify-center"
        style={{ border: `2px solid ${color}` }}
      >
        <span className="absolute top-0 text-[9px] text-text-secondary">12</span>
        <span className="absolute right-0 text-[9px] text-text-secondary">3</span>
        <span className="absolute bottom-0 text-[9px] text-text-secondary">6</span>
        <span className="absolute left-0 text-[9px] text-text-secondary">9</span>

        <div
          className="absolute left-1/2 top-1/2 w-[2px] h-[12px]
                     bg-text-dark rounded-full origin-bottom"
          style={{
            transform: `translateX(-50%) translateY(-100%) rotate(${hourDeg}deg)`
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 w-[1.5px] h-[16px]
                     bg-text-secondary rounded-full origin-bottom"
          style={{
            transform: `translateX(-50%) translateY(-100%) rotate(${minuteDeg}deg)`
          }}
        />

        <div
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      <span className="mt-1 text-[10px] font-medium text-text-muted">
        {label} · {period.toUpperCase()}
      </span>
    </div>
  );
}

export default function ProfileSummaryCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();

  const getInitials = (str) => {
    if (!str) return "U";
    return str
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const initials = getInitials(user?.name || user?.email);

  return (
    <div className="bg-surface rounded-xl border border-border p-6 space-y-6">

      {/* TOP ROW */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard/profile")}
          className="h-10 w-10 rounded-full
                     bg-primary
                     text-white text-sm font-semibold
                     flex items-center justify-center
                     focus:outline-none hover:bg-primary-hover transition-colors"
          title="View profile"
        >
          {initials}
        </button>
      </div>

      {/* CENTER TEXT */}
      <div className="text-center">
        <p className="text-sm font-medium text-text-secondary leading-relaxed">
          Connect your WhatsApp to grow your
          <br />
          <span className="font-semibold text-primary">
            business marketing
          </span>
        </p>
      </div>

      {/* CONNECT WHATSAPP BUTTON */}
      <div className="flex justify-center">
        <button
          onClick={() => navigate("/dashboard/whatsapp")}
          className="rounded-lg bg-success px-6 py-2.5 text-sm
                     font-semibold text-white hover:bg-green-600 transition-colors"
        >
          Connect WhatsApp
        </button>
      </div>

      {/* DAY & DATE */}
      <div className="text-center">
        <p className="text-xs font-semibold tracking-widest text-primary">
          {today.toLocaleDateString([], { weekday: "long" }).toUpperCase()}
        </p>
        <p className="text-sm text-text-secondary">
          {today.toLocaleDateString([], {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}
