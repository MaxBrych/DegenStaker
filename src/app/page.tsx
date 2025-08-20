"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { prepareContractCall } from "thirdweb";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { STAKER_ADDRESS, stakerContract, degenContract } from "./config";
import NumberFlow from "@number-flow/react";
import { Clock } from "lucide-react";
import { NumericFormat } from "react-number-format";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 bg-gradient-to-b from-[#1a0b4d] via-[#1a0b4d] to-[#220d60] text-white">
      <TopHeader />
      <TopStats />
      <StakingPlans />
      <DepositTimers />
    </main>
  );
}

function TopHeader() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";
  return (
    <header className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 overflow-hidden grid place-items-center">
        <span className="text-2xl">🧑🏻‍🚀</span>
      </div>
      <div className="leading-tight">
        <div className="text-sm text-white/70">GM Degen</div>
        <div className="text-lg font-semibold">{short}</div>
      </div>
    </header>
  );
}

function TopStats() {
  const totalStaked = useReadContract({ contract: stakerContract, method: "function totalStaked() view returns (uint256)", params: [] });
  const totalUsers = useReadContract({ contract: stakerContract, method: "function totalUsers() view returns (uint256)", params: [] });

  return (
    <section className="mt-6 grid grid-cols-2 gap-4">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_10px_30px_rgba(124,58,237,.15)]">
        <div className="flex items-center gap-3">
          <Image src="/icons/staked_icon.png" alt="staked" width={28} height={28} />
          <div>
            <div className="text-sm text-white/70">Total Stackd</div>
            <div className="text-xl font-semibold font-mono">
              {toNumberFromWei(totalStaked.data) === undefined ? "-" : (
                <NumberFlow value={toNumberFromWei(totalStaked.data)!} format={{ maximumFractionDigits: 3 }} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_10px_30px_rgba(124,58,237,.15)]">
        <div className="flex items-center gap-3">
          <Image src="/icons/investors_icon.png" alt="investors" width={28} height={28} />
          <div>
            <div className="text-sm text-white/70">Investors</div>
            <div className="text-xl font-semibold font-mono">
              {toNumber(totalUsers.data) === undefined ? "-" : (
                <NumberFlow value={toNumber(totalUsers.data)!} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Removed global Actions; actions now in each plan card

function StakingPlans() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const investMin = useReadContract({ contract: stakerContract, method: "function INVEST_MIN_AMOUNT() view returns (uint256)", params: [] });
  const planMeta: Array<{ idx: 0|1|2; title: string; illus: string; color: "blue"|"purple"|"gold" }> = [
    { idx: 0, title: "Low Risk", illus: "/illus/plan01.png", color: "blue" },
    { idx: 1, title: "Medium Risk", illus: "/illus/plan02.png", color: "purple" },
    { idx: 2, title: "High Risk", illus: "/illus/plan03.png", color: "gold" },
  ];

  return (
    <section className="mt-6">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1 -mx-5 px-5">
        {planMeta.map((p) => (
          <div key={p.idx} className="snap-center w-[88%] flex-shrink-0">
            <PlanCard
              i={p.idx}
              title={p.title}
              illus={p.illus}
              color={p.color}
              investMin={investMin.data}
              address={address}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanCard({ i, title, illus, color, investMin, address }: { i: 0|1|2; title: string; illus: string; color: "blue"|"purple"|"gold"; investMin?: bigint; address?: `0x${string}` }) {
  const plan = useReadContract({ contract: stakerContract, method: "function getPlanInfo(uint8) view returns (uint256,uint256)", params: [i] });
  const [amount, setAmount] = useState<string>("");
  const depositAmount = useMemo(() => {
    try { return parseUnits(amount && amount.length > 0 ? amount : "0", 18); } catch { return 0n; }
  }, [amount]);
  const result = useReadContract({ contract: stakerContract, method: "function getResult(uint8,uint256) view returns (uint256,uint256,uint256,uint256)", params: [i, depositAmount] });
  const { mutate: sendTx, isPending } = useSendTransaction();

  const approveThenInvest = async () => {
    if (!address || depositAmount <= 0n) return;
    const approve = prepareContractCall({ contract: degenContract, method: "function approve(address spender, uint256 amount) returns (bool)", params: [STAKER_ADDRESS, depositAmount] });
    const invest = prepareContractCall({ contract: stakerContract, method: "function invest(address referrer, uint8 plan, uint256 amount)", params: ["0x0000000000000000000000000000000000000000", i, depositAmount] });
    await new Promise<void>((resolve, reject) => sendTx(approve, { onSuccess: () => resolve(), onError: reject }));
    await new Promise<void>((resolve, reject) => sendTx(invest, { onSuccess: () => resolve(), onError: reject }));
  };
  const withdraw = () => { const tx = prepareContractCall({ contract: stakerContract, method: "function withdraw()", params: [] }); sendTx(tx); };

  const time = plan.data ? Number(plan.data[0]) : undefined;
  const percent = plan.data ? Number(plan.data[1]) : undefined; // per 1000 per day
  const dailyRateValue = percent !== undefined ? percent / 10 : undefined;
  const projectedProfitNum = result.data ? Number(formatUnits(result.data[1], 18)) : undefined;

  const [showMore, setShowMore] = useState(false);
  const [snoozeDays, setSnoozeDays] = useState<string>("1");
  const [snoozeIndex, setSnoozeIndex] = useState<string>("0");
  const snoozeAll = () => { const tx = prepareContractCall({ contract: stakerContract, method: "function snoozeAll(uint256)", params: [BigInt(Number(snoozeDays || "1"))] }); sendTx(tx); };
  const snoozeAt = () => { const tx = prepareContractCall({ contract: stakerContract, method: "function snoozeAt(uint256,uint256)", params: [BigInt(Number(snoozeIndex || "0")), BigInt(Number(snoozeDays || "1"))] }); sendTx(tx); };

  const isActive = depositAmount > 0n && (projectedProfitNum ?? 0) > 0;
  const containerClass = isActive
    ? "border border-white/10 bg-[linear-gradient(180deg,#240077_0%,#854CFE_100%)]"
    : "border border-transparent bg-[#3B2887]";

  return (
    <div className={`relative rounded-3xl p-6 shadow-[0_10px_40px_rgba(124,58,237,.15)] overflow-hidden ${containerClass}`}>
      <div className="absolute -right-6 -bottom-10 opacity-60 select-none pointer-events-none">
        <Image src={illus} alt="plan" width={210} height={210} />
      </div>
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedChart isActive={isActive} returnValue={projectedProfitNum ?? 0} color={color} />
        </div>
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 grid place-items-center overflow-hidden">
            <Image src={illus} alt="icon" width={28} height={28} />
          </div>
          <div>
            <div className="text-xl font-semibold">{title}</div>
            <div className="text-white/70 text-sm">{dailyRateValue ?? "-"}% daily • {time ?? "-"} days</div>
          </div>
        </div>

        <div className="text-center mt-6">
          <div className="text-white/70 mb-1">Expected Profit</div>
          <AnimatedExpectedProfit value={projectedProfitNum} active={depositAmount > 0n} />
          <div className="text-white/70 mt-1">$DEGEN</div>
        </div>

        <div className="mt-6">
          <label className="block text-sm mb-2 text-white/90">Investment Amount</label>
          <NumericFormat
            placeholder={investMin ? `1 DEGEN` : "1 DEGEN"}
            value={amount}
            onValueChange={(v) => setAmount(v.value)}
            thousandSeparator
            allowNegative={false}
            decimalScale={2}
            className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 mt-4">
          <button onClick={approveThenInvest} disabled={isPending || depositAmount <= 0n} className="rounded-xl bg-white text-purple-900 font-semibold py-3 disabled:opacity-60">Invest</button>
          <button onClick={withdraw} disabled={isPending} className="rounded-xl bg-white/10 border border-white/20 font-semibold py-3">Withdraw</button>
        </div>
      </div>
    </div>
  );
}

function DepositTimers() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const deposits = useReadContract({
    contract: stakerContract,
    method:
      "function getUserDeposits(address) view returns ((uint8 plan, uint256 percent, uint256 amount, uint256 profit, uint256 start, uint256 finish, uint256 tax)[])",
    params: [address ?? zeroAddress],
  });
  const data = (deposits.data as any[] | undefined) ?? [];

  const topThree = data.slice(0, 3);
  return (
    <section className="mt-6 space-y-5">
      {topThree.length === 0 && (
        <div className="text-white/60 text-sm">No active deposits yet.</div>
      )}
      {topThree.map((d, i) => (
        <TimerCard key={i} planIndex={Number(d.plan)} amount={d.profit} finish={d.finish} />
      ))}
    </section>
  );
}

function TimerCard({ planIndex, amount, finish }: { planIndex: number; amount: bigint; finish: bigint }) {
  const timeLeft = formatTimeLeft(finish);
  const illus = ["/illus/plan01.png", "/illus/plan02.png", "/illus/plan03.png"][planIndex % 3];
  const isMature = Number(finish) <= Math.floor(Date.now() / 1000);
  const { mutate: sendTx } = useSendTransaction();
  const withdraw = () => {
    const tx = prepareContractCall({ contract: stakerContract, method: "function withdraw()", params: [] });
    sendTx(tx);
  };
  return (
    <div className="relative rounded-3xl p-5 bg-[#2C1E72] border border-white/10 overflow-hidden">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70">
        <Image src={illus} alt="chips" width={110} height={110} />
      </div>
      <div className="relative z-10">
        <div className="text-white/70">Time remaining</div>
        <div className="text-3xl font-semibold mt-1">{formatUnits(amount, 18)} $DEGEN</div>
        {isMature ? (
          <button onClick={withdraw} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white text-purple-900 font-semibold px-4 py-2">Withdraw</button>
        ) : (
          <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-4 py-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// legacy helpers no longer used directly but kept for reference

function formatIf(v?: bigint) {
  if (v === undefined) return "-";
  try {
    return formatUnits(v, 18);
  } catch {
    return v.toString();
  }
}

function formatTime(v?: bigint) {
  if (!v) return "-";
  const d = new Date(Number(v) * 1000);
  return d.toLocaleDateString();
}

function formatTimeLeft(finish?: bigint) {
  if (!finish) return "--:--";
  const now = Math.floor(Date.now() / 1000);
  const seconds = Math.max(0, Number(finish) - now);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toNumberFromWei(value?: bigint): number | undefined {
  if (value === undefined) return undefined;
  try {
    return Number(formatUnits(value, 18));
  } catch {
    return undefined;
  }
}

function toNumber(value?: bigint): number | undefined {
  if (value === undefined) return undefined;
  try {
    return Number(value);
  } catch {
    return undefined;
  }
}

function AnimatedStat(props: { label: string; value?: number; suffix?: string; fractionDigits?: number }) {
  const { label, value, suffix, fractionDigits = 0 } = props;
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-mono num">
        {value === undefined ? (
          "-"
        ) : (
          <NumberFlow
            value={value}
            suffix={suffix}
            format={{ minimumFractionDigits: 0, maximumFractionDigits: fractionDigits }}
          />
        )}
      </span>
    </div>
  );
}

// Always-animated NumberFlow that never shows a dash; holds previous value until next is ready
function AnimatedExpectedProfit(props: { value?: number; active: boolean }) {
  const { value, active } = props;
  const [display, setDisplay] = useState<number>(0);
  const [hasInit, setHasInit] = useState(false);

  useEffect(() => {
    if (value === undefined || Number.isNaN(value)) return; // keep previous value to avoid flicker
    setDisplay(value);
    setHasInit(true);
  }, [value]);

  return (
    <NumberFlow
      value={hasInit ? display : 0}
      format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
      className="text-5xl font-medium tracking-tight leading-tight"
      style={{ color: active ? "#a78bfa" : "#9ca3af" }}
      transformTiming={{ duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      spinTiming={{ duration: 900, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      opacityTiming={{ duration: 300, easing: "ease-out" }}
      trend={value !== undefined ? (value >= (display ?? 0) ? 1 : -1) : 0}
      willChange
    />
  );
}

function AnimatedChart({ isActive, returnValue, color = "purple" }: { isActive: boolean; returnValue: number; color?: string }) {
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => { setIsAnimating(isActive); }, [isActive]);
  const generateExponentialPath = (rv: number) => {
    const baseHeight = 80;
    const maxCurve = Math.min(rv / 10000, 8);
    const exponentialFactor = 1 + maxCurve * 0.4;
    const point1Y = baseHeight - 10 * exponentialFactor;
    const point2Y = baseHeight - 25 * exponentialFactor;
    const point3Y = baseHeight - 45 * exponentialFactor;
    const endY = Math.max(5, baseHeight - 65 * exponentialFactor);
    return `M0,${baseHeight} Q30,${point1Y} 60,${point2Y} T120,${point3Y} T200,${endY}`;
  };
  const pathData = generateExponentialPath(returnValue);
  const fillPath = `${pathData} L200,100 L0,100 Z`;
  const gradientColors: Record<string, string> = {
    purple: "#a855f7",
    green: "#22c55e",
    gray: "#9ca3af",
    blue: "#3b82f6",
    gold: "#eab308",
  };
  return (
    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={gradientColors[color]} stopOpacity="0.6" />
          <stop offset="100%" stopColor={gradientColors[color]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#gradient-${color})`} style={{ opacity: isAnimating ? 1 : 0, transition: "opacity 0.3s ease-out, d 0.5s ease-out" }} />
      <path d={pathData} fill="none" stroke={gradientColors[color]} strokeWidth="0.5" strokeLinecap="round" strokeDasharray="400" strokeDashoffset={isAnimating ? 0 : 400} style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1), d 0.5s ease-out" }} />
    </svg>
  );
}

// removed older components for the previous layout
