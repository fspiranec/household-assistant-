import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";
import { Household } from "@/types";

type HouseholdMemberRow = {
  household_id: string;
  user_id: string;
  role: string;
};

type UserRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

type HouseholdResponse = Household & {
  current_user_role: string | null;
  members: Array<{
    id: string;
    role: string;
    display_name: string;
    email: string;
  }>;
};

function formatDisplayName(user: UserRow | undefined) {
  if (!user) return "Unknown user";

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return fullName || user.username || user.email;
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data: membershipData, error: membershipError } = await auth.supabase
    .from("household_members")
    .select("household_id,user_id,role")
    .eq("user_id", auth.user.id);

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 });
  }

  const memberships = (membershipData ?? []) as HouseholdMemberRow[];
  const householdIds = [...new Set(memberships.map((membership) => membership.household_id))];

  if (householdIds.length === 0) {
    return NextResponse.json([]);
  }

  const [{ data: householdsData, error: householdsError }, { data: allMembersData, error: allMembersError }] = await Promise.all([
    auth.supabase.from("households").select("id,name").in("id", householdIds).order("name"),
    auth.supabase.from("household_members").select("household_id,user_id,role").in("household_id", householdIds)
  ]);

  if (householdsError) {
    return NextResponse.json({ error: householdsError.message }, { status: 400 });
  }

  if (allMembersError) {
    return NextResponse.json({ error: allMembersError.message }, { status: 400 });
  }

  const allMembers = (allMembersData ?? []) as HouseholdMemberRow[];
  const userIds = [...new Set(allMembers.map((member) => member.user_id))];

  let users: UserRow[] = [];
  if (userIds.length > 0) {
    const { data: usersData, error: usersError } = await auth.supabase
      .from("users")
      .select("id,username,first_name,last_name,email")
      .in("id", userIds);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    users = (usersData ?? []) as UserRow[];
  }

  const userMap = new Map(users.map((user) => [user.id, user]));
  const roleByHousehold = new Map(memberships.map((membership) => [membership.household_id, membership.role]));

  const households = ((householdsData ?? []) as Household[]).map((household) => {
    const currentUserRole = roleByHousehold.get(household.id) ?? null;
    const isOwner = currentUserRole === "owner";
    const members = isOwner
      ? allMembers
          .filter((member) => member.household_id === household.id)
          .map((member) => {
            const user = userMap.get(member.user_id);
            return {
              id: member.user_id,
              role: member.role,
              display_name: formatDisplayName(user),
              email: user?.email ?? ""
            };
          })
          .sort((a, b) => a.display_name.localeCompare(b.display_name))
      : [];

    return {
      ...household,
      current_user_role: currentUserRole,
      members
    } satisfies HouseholdResponse;
  });

  return NextResponse.json(households);
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { name } = await req.json();
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Household name is required" }, { status: 400 });
  }

  const { data: household, error } = await auth.supabase
    .from("households")
    .insert({ name: name.trim(), created_by: auth.user.id })
    .select("id,name")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { error: memberError } = await auth.supabase
    .from("household_members")
    .insert({ household_id: household.id, user_id: auth.user.id, role: "owner" });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json(household, { status: 201 });
}
