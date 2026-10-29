export default function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="my-2 w-full max-w-md rounded-2xl bg-(--color-surface) p-5 shadow-xl sm:p-8">
      {children}
    </div>
  );
}