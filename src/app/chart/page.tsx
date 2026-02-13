import BarChart from '@/components/BarChart';

export default function TestPage() {
  const dummyData = [
    { label: 'LCP (로딩)', value: 92 },
    { label: 'INP (응답성)', value: 88 },
    { label: 'CLS (안정성)', value: 95 },
    { label: 'FCP (첫 화면)', value: 84 },
    { label: 'TTFB (서버)', value: 76 },
    { label: 'Asset Size', value: 65 },
  ];

  return (
    <main
      style={{
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}
      >
        Web Performance Dashboard (Rust + TSX)
      </h1>
      <div
        style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        }}
      >
        <BarChart data={dummyData} />
      </div>
    </main>
  );
}
