import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkPlan() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsPro(false);
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("plano")
          .eq("id", session.user.id)
          .single();

        // Verifica se o plano é 'pro' (ou qualquer outra lógica que você definir)
        setIsPro(profile?.plano === "pro");
      } catch (error) {
        console.error("Erro ao verificar plano:", error);
        setIsPro(false);
      } finally {
        setLoading(false);
      }
    }

    checkPlan();
  }, []);

  return { isPro, loading };
}