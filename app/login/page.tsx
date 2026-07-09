import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">XAIXO Pedidos</h1>
          <p className="mt-1 text-sm text-gray-500">Acceso solo para el equipo interno</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-200">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
