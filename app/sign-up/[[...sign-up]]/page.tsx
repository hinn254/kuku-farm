import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7f4] p-6">
      <SignUp />
    </div>
  );
}
