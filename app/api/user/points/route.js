import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sql } from '@/lib/db';

// POST: ポイント更新
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { points, combo } = await request.json();

    const updated = await sql`
      UPDATE users
      SET
        total_points = total_points + ${points || 0},
        max_combo = GREATEST(max_combo, ${combo || 0})
      WHERE id = ${session.user.id}
      RETURNING total_points, max_combo
    `;

    return NextResponse.json({
      totalPoints: updated[0].total_points,
      maxCombo: updated[0].max_combo
    });
  } catch (error) {
    console.error('Update points error:', error);
    return NextResponse.json({ error: 'ポイント更新に失敗' }, { status: 500 });
  }
}

// GET: ユーザー情報取得
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const user = await sql`
      SELECT total_points, max_combo FROM users WHERE id = ${session.user.id}
    `;

    return NextResponse.json({
      totalPoints: user[0]?.total_points || 0,
      maxCombo: user[0]?.max_combo || 0
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'ユーザー情報取得に失敗' }, { status: 500 });
  }
}
