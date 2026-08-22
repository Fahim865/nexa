import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, LayoutDashboard, Loader2, LogIn, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type NexaAccountMenuProps = {
  compact?: boolean;
};

function initial(name?: string | null, email?: string | null) {
  return (name?.trim().charAt(0) || email?.trim().charAt(0) || "N").toUpperCase();
}

/** Shared authenticated account affordance for the public NEXA product surfaces. */
export function NexaAccountMenu({ compact = false }: NexaAccountMenuProps) {
  const [, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();

  const signOut = async () => {
    try {
      await logout();
      toast.success("Signed out of NEXA.");
      setLocation("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out. Please try again.");
    }
  };

  if (loading) {
    return <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/55"><Loader2 className="size-4 animate-spin" /></span>;
  }

  if (!user) {
    return (
      <button className="nav-cta" type="button" onClick={() => setLocation("/sign-in")}>
        Sign in <LogIn size={16} />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex max-w-[220px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-2 text-left text-white transition-colors hover:border-[#59B5FF]/45 hover:bg-[#59B5FF]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#59B5FF]"
          aria-label="Open account menu"
        >
          <Avatar className="size-7 border border-[#59B5FF]/35 bg-[#0a2138]">
            <AvatarFallback className="bg-[#0a2138] text-[11px] font-bold text-[#a9dcff]">{initial(user.name, user.email)}</AvatarFallback>
          </Avatar>
          {!compact ? <span className="min-w-0 pr-1"><span className="block truncate text-xs font-semibold leading-tight">{user.name || "NEXA member"}</span><span className="block truncate text-[10px] text-white/45">Account</span></span> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 border-white/10 bg-[#0a1727] text-[#f5f8ff]">
        <DropdownMenuLabel className="px-3 py-2.5">
          <p className="truncate text-sm font-semibold">{user.name || "NEXA member"}</p>
          <p className="mt-0.5 truncate text-xs font-normal text-white/50">{user.email || "Signed-in account"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="cursor-pointer gap-2.5 focus:bg-[#59B5FF]/15 focus:text-white" onClick={() => setLocation("/account")}>
          <UserRound className="size-4" /> My profile
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2.5 focus:bg-[#59B5FF]/15 focus:text-white" onClick={() => setLocation("/account#billing")}>
          <CreditCard className="size-4" /> Billing & credits
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer gap-2.5 focus:bg-[#59B5FF]/15 focus:text-white" onClick={() => setLocation("/tools")}>
          <LayoutDashboard className="size-4" /> Tool workspace
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="cursor-pointer gap-2.5 text-[#ffadad] focus:bg-red-500/10 focus:text-[#ffbcbc]" onClick={signOut}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
