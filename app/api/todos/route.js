import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sql } from '@/lib/db';

// GET: タスク一覧取得
export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const todos = await sql`
      SELECT * FROM todos
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ todos });
  } catch (error) {
    console.error('Get todos error:', error);
    return NextResponse.json({ error: 'タスク取得に失敗' }, { status: 500 });
  }
}

// POST: タスク追加
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'タスク内容は必須です' }, { status: 400 });
    }

    const newTodo = await sql`
      INSERT INTO todos (user_id, text)
      VALUES (${session.user.id}, ${text.trim()})
      RETURNING *
    `;

    return NextResponse.json({ todo: newTodo[0] });
  } catch (error) {
    console.error('Create todo error:', error);
    return NextResponse.json({ error: 'タスク作成に失敗' }, { status: 500 });
  }
}

// PATCH: タスク更新（完了）
export async function PATCH(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id, completed } = await request.json();

    const updated = await sql`
      UPDATE todos
      SET completed = ${completed}
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING *
    `;

    return NextResponse.json({ todo: updated[0] });
  } catch (error) {
    console.error('Update todo error:', error);
    return NextResponse.json({ error: 'タスク更新に失敗' }, { status: 500 });
  }
}

// DELETE: タスク削除
export async function DELETE(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await sql`
      DELETE FROM todos
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    return NextResponse.json({ error: 'タスク削除に失敗' }, { status: 500 });
  }
}
