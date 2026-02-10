import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'パチンコ TODO',
  description: 'ドパガキ専用タスク管理アプリ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
