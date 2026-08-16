import StockChart from "@/app/components/StockChart";

export default function StocksPage() {
  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center py-16 px-6 bg-white dark:bg-black">
        <h1 className="text-2xl font-semibold mb-6 self-start">
          Stock Explorer
        </h1>
        <StockChart />
      </main>
    </div>
  );
}
