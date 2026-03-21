import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/helpers";

type HouseholdMemberProfileRow = {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
};

type HouseholdMemberRow = {
  user_id: string;
  role: string;
};

type HouseholdResponse = {
  id: string;
  name: string;
  current_user_role: string;
  members: Array<{
    id: string;
    display_name: string;
    email: string;
    role: string;
  }>;
};

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("household_members")
    .select("role,households!inner(id,name)")
    .eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const memberships = (data ?? []) as Array<{
    role: string;
    households: Array<{ id: string; name: string }> | null;
  }>;

  const households = memberships
    .map((membership) => ({
      id: membership.households?.[0]?.id,
      name: membership.households?.[0]?.name,
      current_user_role: membership.role
    }))
    .filter((household): household is { id: string; name: string; current_user_role: string } => Boolean(household.id && household.name));

  const ownerHouseholdIds = households.filter((household) => household.current_user_role === "owner").map((household) => household.id);

  let membersByHousehold = new Map<string, HouseholdResponse["members"]>();
  if (ownerHouseholdIds.length > 0) {
    const { data: memberData, error: memberError } = await auth.supabase
      .from("household_members")
      .select("household_id,user_id,role")
      .in("household_id", ownerHouseholdIds);

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 400 });

    const memberRows = (memberData ?? []) as Array<HouseholdMemberRow & { household_id: string }>;
    const userIds = [...new Set(memberRows.map((member) => member.user_id))];

    let usersById = new Map<string, HouseholdMemberProfileRow>();
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await auth.supabase
        .from("users")
        .select("id,username,first_name,last_name,email")
        .in("id", userIds);

      if (usersError) return NextResponse.json({ error: usersError.message }, { status: 400 });

      usersById = new Map(((usersData ?? []) as HouseholdMemberProfileRow[]).map((user) => [user.id, user]));
    }

    membersByHousehold = memberRows.reduce((acc, member) => {
      const user = usersById.get(member.user_id);
      const displayName = user ? `${user.first_name} ${user.last_name}`.trim() || user.username || user.email : member.user_id;
      const householdMembers = acc.get(member.household_id) ?? [];
      householdMembers.push({
        id: member.user_id,
        display_name: displayName,
        email: user?.email ?? "",
        role: member.role
      });
      acc.set(member.household_id, householdMembers);
      return acc;
    }, new Map<string, HouseholdResponse["members"]>());
  }

  const response: HouseholdResponse[] = households.map((household) => ({
    ...household,
    members: membersByHousehold.get(household.id) ?? []
  }));

  return NextResponse.json(response);
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
