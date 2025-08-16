"use client";

import { useMemo, useState, useEffect } from "react";
import { prepareContractCall } from "thirdweb";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import {
  ConnectButton,
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { client } from "./client";
import { CHAIN, STAKER_ADDRESS, stakerContract, degenContract } from "./config";
import NumberFlow from "@number-flow/react";
import { Shield, TrendingUp, Crown, Star, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NumericFormat } from "react-number-format";

export default function Home() {
  return (
    <main className="min-h-[100vh] container max-w-6xl mx-auto p-6">
      <HeaderBar />

      <PlansAndInvest />

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ContractStats />
        <UserStats />
      </div>

      <div className="mt-10">
        <DepositsCard />
      </div>
    </main>
  );
}

function HeaderBar() {
  return (
    <header className="flex items-center justify-between mb-6 md:mb-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Degen Staker</h1>
        <p className="hidden sm:block text-sm text-zinc-500 dark:text-zinc-400">Stake DEGEN on Base to earn time-based returns with optional snooze extensions.</p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <ConnectButton client={client} chain={CHAIN} />
      </div>
    </header>
  );
}

function ThemeToggle() {
  // simple client component toggle
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return (localStorage.getItem("theme") || "dark") === "dark";
    } catch {
      return true;
    }
  });
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
      if (next) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } catch {}
  };
  return (
    <button onClick={toggle} className="btn-outline">
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

function ContractStats() {
  const totalStaked = useReadContract({ contract: stakerContract, method: "function totalStaked() view returns (uint256)", params: [] });
  const totalUsers = useReadContract({ contract: stakerContract, method: "function totalUsers() view returns (uint256)", params: [] });
  const balance = useReadContract({ contract: stakerContract, method: "function getContractBalance() view returns (uint256)", params: [] });
  return (
    <Card title="Contract">
      <AnimatedStat label="Total Staked" value={toNumberFromWei(totalStaked.data)} suffix=" DEGEN" fractionDigits={4} />
      <AnimatedStat label="Users" value={toNumber(totalUsers.data)} />
      <AnimatedStat label="Vault" value={toNumberFromWei(balance.data)} suffix=" DEGEN" fractionDigits={4} />
    </Card>
  );
}

function UserStats() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const available = useReadContract({ contract: stakerContract, method: "function getUserAvailable(address) view returns (uint256)", params: [address ?? zeroAddress] });
  const refBonus = useReadContract({ contract: stakerContract, method: "function getUserReferralBonus(address) view returns (uint256)", params: [address ?? zeroAddress] });
  const deposits = useReadContract({ contract: stakerContract, method: "function getUserAmountOfDeposits(address) view returns (uint256)", params: [address ?? zeroAddress] });
  return (
    <Card title="You">
      <AnimatedStat label="Available" value={toNumberFromWei(available.data)} suffix=" DEGEN" fractionDigits={4} />
      <AnimatedStat label="Referral Bonus" value={toNumberFromWei(refBonus.data)} suffix=" DEGEN" fractionDigits={4} />
      <AnimatedStat label="# Deposits" value={toNumber(deposits.data)} />
    </Card>
  );
}

// Removed global Actions; actions now in each plan card

function PlansAndInvest() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;

  const investMin = useReadContract({ contract: stakerContract, method: "function INVEST_MIN_AMOUNT() view returns (uint256)", params: [] });
  const plan0 = useReadContract({ contract: stakerContract, method: "function getPlanInfo(uint8) view returns (uint256,uint256)", params: [0] });
  const plan1 = useReadContract({ contract: stakerContract, method: "function getPlanInfo(uint8) view returns (uint256,uint256)", params: [1] });
  const plan2 = useReadContract({ contract: stakerContract, method: "function getPlanInfo(uint8) view returns (uint256,uint256)", params: [2] });
  const planCards = [plan0, plan1, plan2];
  const planMeta = [
    { title: "Starter", highlight: false },
    { title: "Growth", highlight: true },
    { title: "Pro", highlight: false },
  ];

  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">Choose Your Staking Plan</h2>
      <div className="md:grid md:gap-6 md:grid-cols-3">
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 md:hidden">
          {[0,1,2].map((i) => (
            <div key={i} className="snap-center flex-shrink-0 w-3/4">
              <MinimalStakingCard
                i={i as 0|1|2}
                planInfo={planCards[i].data as any}
                planTitle={planMeta[i].title}
                popular={planMeta[i].highlight}
                investMin={investMin.data}
                address={address}
              />
            </div>
          ))}
        </div>
        <div className="hidden md:contents">
          {[0,1,2].map((i) => (
            <MinimalStakingCard
              key={i}
              i={i as 0|1|2}
              planInfo={planCards[i].data as any}
              planTitle={planMeta[i].title}
              popular={planMeta[i].highlight}
              investMin={investMin.data}
              address={address}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DepositsCard() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const deposits = useReadContract({
    contract: stakerContract,
    method:
      "function getUserDeposits(address) view returns ((uint8 plan, uint256 percent, uint256 amount, uint256 profit, uint256 start, uint256 finish, uint256 tax)[])",
    params: [address ?? zeroAddress],
  });

  const data = deposits.data as any[] | undefined;
  return (
    <section className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-medium">Your Deposits</div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <div className="hidden md:grid grid-cols-8 gap-3 text-xs text-zinc-400 px-2 py-1">
          <div>Plan</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Profit</div>
          <div>Start</div>
          <div>Finish</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="space-y-2">
          {!data?.length && <div className="text-zinc-500 text-sm">No deposits yet.</div>}
          {data?.map((d, i) => (
            <DepositRow key={i} index={i} deposit={d} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SnoozeAll() {
  const [days, setDays] = useState<string>("1");
  const { mutate: send } = useSendTransaction();
  return (
    <div className="flex gap-2 items-center">
      <input className="w-16 border rounded px-2 py-1 bg-transparent" value={days} onChange={(e) => setDays(e.target.value)} />
      <WriteButton
        label="Snooze All"
        onClick={() => {
          const tx = prepareContractCall({ contract: stakerContract, method: "function snoozeAll(uint256)", params: [BigInt(Number(days))] });
          send(tx);
        }}
      />
    </div>
  );
}

function SnoozeAt() {
  const [index, setIndex] = useState<string>("0");
  const [days, setDays] = useState<string>("1");
  const { mutate: send } = useSendTransaction();
  return (
    <div className="flex gap-2 items-center">
      <input className="w-16 border rounded px-2 py-1 bg-transparent" value={index} onChange={(e) => setIndex(e.target.value)} />
      <input className="w-16 border rounded px-2 py-1 bg-transparent" value={days} onChange={(e) => setDays(e.target.value)} />
      <WriteButton
        label="Snooze"
        onClick={() => {
          const tx = prepareContractCall({ contract: stakerContract, method: "function snoozeAt(uint256,uint256)", params: [BigInt(Number(index)), BigInt(Number(days))] });
          send(tx);
        }}
      />
    </div>
  );
}

function WriteButton(props: { label: string; onClick: () => void; disabled?: boolean; method?: any }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className="w-full bg-zinc-800 hover:bg-zinc-700 rounded py-2 disabled:opacity-50"
    >
      {props.label}
    </button>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-zinc-800 rounded-lg p-4">
      <div className="font-medium mb-3">{props.title}</div>
      {props.children}
    </section>
  );
}

function Stat(props: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-zinc-400">{props.label}</span>
      <span className="font-mono">{props.value}{props.suffix ?? ""}</span>
    </div>
  );
}

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
      className="text-5xl font-medium leading-tight"
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

function MinimalStakingCard(props: {
  i: 0 | 1 | 2;
  planInfo?: readonly [bigint, bigint]; // (time, percent per 1000 per day)
  planTitle: string;
  popular?: boolean;
  investMin?: bigint;
  address?: `0x${string}`;
}) {
  const { i, planInfo, planTitle, popular, investMin, address } = props;
  const [amount, setAmount] = useState<string>("");
  const [referrer, setReferrer] = useState<string>("");
  const [snoozeDays, setSnoozeDays] = useState<string>("1");
  const [snoozeIndex, setSnoozeIndex] = useState<string>("0");

  const depositAmount = useMemo(() => {
    try {
      return parseUnits(amount && amount.length > 0 ? amount : "0", 18);
    } catch {
      return 0n;
    }
  }, [amount]);

  const result = useReadContract({
    contract: stakerContract,
    method: "function getResult(uint8,uint256) view returns (uint256,uint256,uint256,uint256)",
    params: [i, depositAmount],
  });

  const { mutate: sendTx, isPending } = useSendTransaction();

  const approveThenInvest = async () => {
    if (!address || depositAmount <= 0n) return;
    const approve = prepareContractCall({
      contract: degenContract,
      method: "function approve(address spender, uint256 amount) returns (bool)",
      params: [STAKER_ADDRESS, depositAmount],
    });
    const ref = /^0x[0-9a-fA-F]{40}$/.test(referrer)
      ? (referrer as `0x${string}`)
      : ("0x0000000000000000000000000000000000000000" as `0x${string}`);
    const invest = prepareContractCall({
      contract: stakerContract,
      method: "function invest(address referrer, uint8 plan, uint256 amount)",
      params: [ref, i, depositAmount],
    });
    await new Promise<void>((resolve, reject) => sendTx(approve, { onSuccess: () => resolve(), onError: reject }));
    await new Promise<void>((resolve, reject) => sendTx(invest, { onSuccess: () => resolve(), onError: reject }));
  };

  const withdraw = () => {
    const tx = prepareContractCall({ contract: stakerContract, method: "function withdraw()", params: [] });
    sendTx(tx);
  };

  const snoozeAll = () => {
    const tx = prepareContractCall({
      contract: stakerContract,
      method: "function snoozeAll(uint256)",
      params: [BigInt(Number(snoozeDays || "1"))],
    });
    sendTx(tx);
  };

  const snoozeAt = () => {
    const tx = prepareContractCall({
      contract: stakerContract,
      method: "function snoozeAt(uint256,uint256)",
      params: [BigInt(Number(snoozeIndex || "0")), BigInt(Number(snoozeDays || "1"))],
    });
    sendTx(tx);
  };

  const time = planInfo ? Number(planInfo[0]) : undefined;
  const percent = planInfo ? Number(planInfo[1]) : undefined; // per 1000 per day
  const dailyRateValue = percent !== undefined ? percent / 10 : undefined;
  const projectedProfitNum = result.data ? Number(formatUnits(result.data[1], 18)) : undefined;
  const projectedFinish = result.data ? formatTime(result.data[2]) : "-";

  const [showRef, setShowRef] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Animated chart state
  const isActive = depositAmount > 0n && (projectedProfitNum ?? 0) > 0;
  const chartColor = i === 0 ? "blue" : i === 1 ? "purple" : "gold";

  return (
    <div className="relative flex-shrink-0 w-full pt-4">
      {popular && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-20">
          <Badge className="bg-purple-500 text-white px-4 py-1 shadow-md">
            <Star className="w-3 h-3 mr-1" /> Popular
          </Badge>
        </div>
      )}

      <div className={`relative rounded-xl p-6 transition-all duration-500 border ${depositAmount > 0n ? "bg-white/60 border-primary/30 dark:bg-primary/10 dark:border-primary/40" : "bg-white/80 border-zinc-200 dark:bg-black/30 dark:border-zinc-800"}`}>
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedChart isActive={isActive} returnValue={projectedProfitNum ?? 0} color={chartColor} />
          </div>
        )}
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-2 mb-1">
            {(i === 0 && <Shield className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />) || (i === 1 && <TrendingUp className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />) || (i === 2 && <Crown className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />)}
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">{planTitle} Plan</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dailyRateValue ?? "-"}% daily • {time ?? "-"} days</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs md:text-sm mb-3">
          <div>
            <span className="text-zinc-400">Term</span>
            <div className="font-medium num font-mono">{time ?? "-"} days</div>
          </div>
          <div>
            <span className="text-zinc-400">Daily</span>
            <div className="font-medium num font-mono">
              {dailyRateValue === undefined ? "-" : (
                <NumberFlow value={dailyRateValue} suffix="% / day" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center mb-6">
          <p className="text-sm mb-2 text-zinc-600">Expected Profit</p>
          <div className="mb-1">
            <AnimatedExpectedProfit
              value={projectedProfitNum}
              active={depositAmount > 0n}
            />
          </div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">$DEGEN</p>
        </div>

        <div className="mb-3">
          <label className="block text-xs md:text-sm mb-1 text-zinc-700 dark:text-zinc-300">Amount (DEGEN)</label>
          <NumericFormat
            placeholder={investMin ? `min ${formatUnits(investMin, 18)}` : "1.0"}
            value={amount}
            onValueChange={(v) => setAmount(v.value)}
            thousandSeparator
            allowNegative={false}
            decimalScale={2}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:bg-black/30 dark:text-zinc-100 dark:border-zinc-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button onClick={approveThenInvest} disabled={isPending || depositAmount <= 0n} className="btn-primary text-sm py-2">Invest</button>
          <button onClick={withdraw} disabled={isPending} className="btn-outline text-sm py-2">Withdraw</button>
        </div>

        <div className="relative z-10">
          <button
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
            Advanced options
          </button>
          {showMore && (
            <div className="mt-3 p-4 rounded-md space-y-3 bg-white border border-zinc-200 dark:bg-black/30 dark:border-zinc-700">
              <div>
                <label className="block text-xs font-medium mb-1 text-zinc-700 dark:text-zinc-300">Extend Lock Period (days)</label>
                <div className="flex gap-2">
                  <NumericFormat
                    placeholder="0"
                    value={snoozeDays}
                    onValueChange={(v) => setSnoozeDays(v.value)}
                    decimalScale={0}
                    allowNegative={false}
                    className="flex-1 px-3 py-2 text-sm rounded-md bg-white text-zinc-900 placeholder-zinc-400 border border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-0 dark:bg-black/30 dark:text-zinc-100 dark:border-zinc-700"
                  />
                  <button onClick={snoozeAll} className="px-3 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-700">Snooze</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1">Index</label>
                  <NumericFormat value={snoozeIndex} onValueChange={(v) => setSnoozeIndex(v.value)} decimalScale={0} allowNegative={false} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-zinc-900 dark:bg-black/30 dark:text-zinc-100 dark:border-zinc-700" />
                </div>
                <div className="flex items-end">
                  <button onClick={snoozeAt} className="btn-outline w-full text-sm">Snooze At</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DepositRow({ index, deposit }: { index: number; deposit: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-800/60 rounded-lg p-3 bg-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">Plan {Number(deposit.plan)}</span>
          <div className="text-sm font-mono">{formatIf(deposit.amount)} DEGEN</div>
        </div>
        <div className="text-xs text-zinc-400">Finish {formatTime(deposit.finish)}</div>
        <button onClick={() => setOpen((v) => !v)} className="text-xs text-primary">{open ? "Hide" : "Details"}</button>
      </div>
      {open && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-xs text-zinc-400">Amount</div>
            <div className="font-mono">{formatIf(deposit.amount)} DEGEN</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Profit</div>
            <div className="font-mono">{formatIf(deposit.profit)} DEGEN</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Start</div>
            <div>{formatTime(deposit.start)}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Finish</div>
            <div>{formatTime(deposit.finish)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
