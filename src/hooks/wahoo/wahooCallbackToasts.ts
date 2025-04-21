
import { useToast } from "@/hooks/use-toast";

export function useWahooCallbackToasts() {
  const { toast } = useToast();

  const errorToast = (title: string, description: string) =>
    toast({ title, description, variant: "destructive" });

  const successToast = (title: string, description: string) =>
    toast({ title, description });

  return {
    errorToast,
    successToast,
  };
}

