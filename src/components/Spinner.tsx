export default function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
