"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dice6, Eye, EyeOff, Check, X, Shield, Mail, User, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  function checkPasswordStrength(password: string) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 4);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 2) {
      setError("Passwort ist zu schwach. Bitte verwenden Sie eine Kombination aus Buchstaben, Zahlen und Sonderzeichen.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registrierung fehlgeschlagen");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <Dice6 className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">BoardGameTools</h1>
          <p className="text-muted-foreground">Deine Brettspiel-Sammlung digital verwalten</p>
        </div>

        {/* Registration Card */}
        <Card className="shadow-xl border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Konto erstellen</CardTitle>
            <CardDescription className="text-center">
              Registriere dich für BoardGameTools
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Max Mustermann"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  autoComplete="name"
                  className="transition-colors focus:border-primary"
                />
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-Mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="email"
                  className="transition-colors focus:border-primary"
                />
              </div>
              
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Passwort
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    className="pr-10 transition-colors focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength
                              ? passwordStrength === 1
                                ? "bg-destructive"
                                : passwordStrength === 2
                                ? "bg-warning"
                                : passwordStrength === 3
                                ? "bg-accent"
                                : "bg-success"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength === 0 && "Passwort-Stärke: Sehr schwach"}
                      {passwordStrength === 1 && "Passwort-Stärke: Schwach"}
                      {passwordStrength === 2 && "Passwort-Stärke: Mittel"}
                      {passwordStrength === 3 && "Passwort-Stärke: Stark"}
                      {passwordStrength === 4 && "Passwort-Stärke: Sehr stark"}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Passwort bestätigen
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    className="pr-10 transition-colors focus:border-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-success">Passwörter stimmen überein</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Passwörter stimmen nicht überein</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Password Requirements */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="text-sm font-medium text-foreground">Passwort-Anforderungen:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      formData.password.length >= 8 ? "bg-success" : "bg-muted"
                    }`} />
                    Mindestens 8 Zeichen
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      /[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? "bg-success" : "bg-muted"
                    }`} />
                    Groß- und Kleinbuchstaben
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      /[0-9]/.test(formData.password) ? "bg-success" : "bg-muted"
                    }`} />
                    Mindestens eine Zahl
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      /[^a-zA-Z0-9]/.test(formData.password) ? "bg-success" : "bg-muted"
                    }`} />
                    Sonderzeichen empfohlen
                  </li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || passwordStrength < 2}
              >
                {isLoading ? "Registrieren..." : "Konto erstellen"}
              </Button>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Bereits ein Konto?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Anmelden
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Mit der Registrierung stimmst du unseren{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Nutzungsbedingungen
                  </Link>{" "}
                  und{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Datenschutzrichtlinien
                  </Link>{" "}
                  zu.
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
