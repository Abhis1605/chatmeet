export default function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-(--color-surface) p-8 rounded-2xl shadow-xl w-full max-w-md">
      {children}
    </div>
  );
}