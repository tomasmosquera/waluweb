import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';

// All pages are user-specific — skip static prerendering
export const dynamic = 'force-dynamic';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-roboto',
});
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToolsProvider } from '@/context/ToolsContext';
import { CategoriesProvider } from '@/context/CategoriesContext';
import { LabelsProvider } from '@/context/LabelsContext';
import { TransactionsProvider } from '@/context/TransactionsContext';
import { BudgetsProvider } from '@/context/BudgetsContext';

export const metadata: Metadata = {
  title: 'Walu',
  description: 'Tu gestor de finanzas personales',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`h-full ${roboto.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToolsProvider>
                <CategoriesProvider>
                  <LabelsProvider>
                    <TransactionsProvider>
                      <BudgetsProvider>
                        {children}
                      </BudgetsProvider>
                    </TransactionsProvider>
                  </LabelsProvider>
                </CategoriesProvider>
              </ToolsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
