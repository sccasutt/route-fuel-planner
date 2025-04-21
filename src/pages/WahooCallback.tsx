
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";
import { exchangeCodeForToken } from "@/components/Wahoo/WahooApi";
import { syncWahooProfileAndRoutes } from "@/components/Wahoo/WahooSyncApi";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

export default function WahooCallback() {
  const [status, setStatus] = useState("Verarbeite Wahoo-Autorisierung...");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get("code");
        const authError = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        const state = searchParams.get("state");
        const storedState = localStorage.getItem("wahoo_auth_state");

        if (authError) {
          console.error("Wahoo authorization error:", authError, errorDesc);
          setStatus("Autorisierung fehlgeschlagen.");
          setError(errorDesc || authError);
          toast({
            title: "Wahoo-Verbindung fehlgeschlagen",
            description: errorDesc || authError,
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }
        
        if (state !== storedState) {
          console.error("Wahoo callback state mismatch:", { state, storedState });
          setStatus("Ungültiger Autorisierungsstatus.");
          setError("Sicherheitsfehler: Autorisierungsvalidierung fehlgeschlagen");
          toast({
            title: "Sicherheitsfehler",
            description: "Autorisierungsvalidierung fehlgeschlagen",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }
        
        if (!code) {
          console.error("No authorization code received from Wahoo");
          setStatus("Kein Autorisierungscode erhalten.");
          setError("Es wurde kein Autorisierungscode von Wahoo empfangen");
          toast({
            title: "Verbindungsfehler",
            description: "Es wurde kein Autorisierungscode von Wahoo empfangen",
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
          return;
        }
        
        console.log("WahooCallback: Valid authorization code received, exchanging for token");
        setStatus("Verbindung mit Ihrem Wahoo-Konto wird hergestellt...");
        
        try {
          const redirectUri = `${window.location.origin}/wahoo-callback`;
          const tokenData = await exchangeCodeForToken(code, redirectUri);
          
          const saveObj = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + (tokenData.expires_in * 1000)
          };
          
          localStorage.setItem("wahoo_token", JSON.stringify(saveObj));
          
          setStatus("Ihre Fahrten werden synchronisiert...");
          try {
            await syncWahooProfileAndRoutes(saveObj);
            setStatus("Ihre Wahoo-Daten wurden erfolgreich synchronisiert!");
          } catch (err) {
            console.error("Error syncing rides:", err);
            
            // Special handling for connection issues
            const errMsg = err?.message || "";
            if (errMsg.includes("Verbindung") || 
                errMsg.includes("abgelehnt") ||
                errMsg.includes("nicht verfügbar") ||
                errMsg.includes("connection") ||
                errMsg.includes("unavailable") ||
                errMsg.includes("timeout")) {
              setStatus("Verbunden, aber der Wahoo-Dienst ist derzeit für die Synchronisation nicht verfügbar.");
              setError("Der Wahoo-Dienst ist derzeit nicht verfügbar. Ihre Verbindung wurde hergestellt, aber Ihre Fahrten konnten nicht synchronisiert werden. Bitte versuchen Sie später, die Synchronisation erneut durchzuführen.");
              toast({
                title: "Teilweise Verbindung",
                description: "Mit Wahoo verbunden, aber der Dienst ist derzeit für die Synchronisation nicht verfügbar. Bitte versuchen Sie später zu synchronisieren.",
                variant: "destructive",
              });
            } else {
              setStatus("Verbunden, aber Ihre Fahrten konnten nicht synchronisiert werden.");
              setError(errMsg || "Fehler bei der Synchronisation Ihrer Fahrten von Wahoo");
              toast({
                title: "Synchronisierungsfehler",
                description: "Fehler bei der Synchronisation Ihrer Fahrten von Wahoo. Bitte versuchen Sie es später erneut.",
                variant: "destructive",
              });
            }
          }
          
          window.dispatchEvent(new CustomEvent("wahoo_connection_changed"));
          
          if (!error) {
            toast({ 
              title: "Wahoo verbunden", 
              description: "Ihr Wahoo-Konto wurde verbunden." 
            });
            
            localStorage.removeItem("wahoo_auth_state");
            
            setTimeout(() => navigate("/dashboard", { state: { wahooConnected: true }}), 3000);
          }
        } catch (tokenError) {
          console.error("Token exchange error:", tokenError);
          
          // Enhanced error handling for connection issues during token exchange
          const tokenErrorMsg = tokenError?.message || "";
          let errorTitle = "Verbindungsfehler";
          let errorDescription = "Verbindung zu Wahoo fehlgeschlagen. Bitte versuchen Sie es erneut.";
          
          if (tokenErrorMsg.includes("Verbindung") || 
              tokenErrorMsg.includes("abgelehnt") ||
              tokenErrorMsg.includes("nicht verfügbar") ||
              tokenErrorMsg.includes("connection") ||
              tokenErrorMsg.includes("unavailable") ||
              tokenErrorMsg.includes("timeout")) {
            errorTitle = "Wahoo-Dienst nicht verfügbar";
            errorDescription = "Der Wahoo-Dienst ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.";
          }
          
          setStatus("Bei der Verbindung mit Wahoo ist ein Fehler aufgetreten.");
          setError(errorDescription);
          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
          });
          setTimeout(() => navigate("/dashboard"), 5000);
        }
      } catch (error) {
        console.error("Error processing Wahoo callback:", error);
        setStatus("Bei der Verarbeitung der Autorisierung ist ein Fehler aufgetreten.");
        setError("Verbindung zu Wahoo fehlgeschlagen. Bitte versuchen Sie es erneut.");
        toast({
          title: "Verbindungsfehler",
          description: "Verbindung zu Wahoo fehlgeschlagen. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/dashboard"), 5000);
      }
    };
    
    processCallback();
  }, [navigate, toast, location.search]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="p-6 bg-card border rounded-lg shadow-sm max-w-md w-full">
          <h1 className="text-xl font-bold mb-4">Wahoo-Verbindung</h1>
          
          {error ? (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Verbindungsfehler
                </AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground mb-4">{status}</p>
              <div className="flex justify-center">
                <Button onClick={() => navigate("/dashboard")}>
                  Zurück zum Dashboard
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{status}</p>
              <div className="flex justify-center">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
