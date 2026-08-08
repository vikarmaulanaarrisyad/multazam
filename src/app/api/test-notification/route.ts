import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role') || 'SALES';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test Supabase JS Client read
    const { data, error } = await supabase
      .from("Notification")
      .select("*")
      .eq("status", "UNREAD")
      .eq("role", role)
      .limit(10);

    // Reload PostgREST schema cache so it sees the new table
    await prisma.$executeRawUnsafe(`NOTIFY pgrst, 'reload schema'`);

    // Enable Supabase Realtime for this table
    try {
      await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";`);
    } catch (e: any) {
      // It might throw if it's already added, ignore
      console.log("Realtime already enabled or error:", e.message);
    }

    // Test Prisma read
    const prismaData = await prisma.notification.findMany({
      where: { role, status: 'UNREAD' }
    });

    return NextResponse.json({ 
      supabaseClientTest: { data, error },
      prismaTest: prismaData
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
