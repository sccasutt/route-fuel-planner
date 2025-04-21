
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import React from "react";

type SignUpProps = {
  form: {
    email: string;
    password: string;
    name: string;
    age: string;
    weight: string;
    goal_type: string;
    diet_type: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export default function SignUpForm({ form, setForm, loading, onSubmit }: SignUpProps) {
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <Input
        required
        name="name"
        placeholder="Full Name"
        value={form.name}
        onChange={handleChange}
      />
      <Input
        name="age"
        placeholder="Age (optional)"
        type="number"
        value={form.age}
        onChange={handleChange}
      />
      <Input
        name="weight"
        placeholder="Weight in kg (optional)"
        type="number"
        value={form.weight}
        onChange={handleChange}
      />
      <Input
        name="goal_type"
        placeholder="Goal (optional)"
        value={form.goal_type}
        onChange={handleChange}
      />
      <Input
        name="diet_type"
        placeholder="Diet type (optional)"
        value={form.diet_type}
        onChange={handleChange}
      />
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
        {loading ? "Loading..." : "Sign Up"}
      </Button>
    </>
  );
}
