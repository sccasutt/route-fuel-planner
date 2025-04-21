
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";

type LoginProps = {
  form: {
    email: string;
    password: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export default function LoginForm({ form, setForm, loading, onSubmit }: LoginProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <Input
        required
        name="email"
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={handleChange}
        autoComplete="username"
      />
      <Input
        required
        name="password"
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={handleChange}
        autoComplete="current-password"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </Button>
    </>
  );
}
