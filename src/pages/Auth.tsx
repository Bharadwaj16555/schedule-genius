import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReCAPTCHA from "react-google-recaptcha";
import { z } from "zod";
import { Shield } from "lucide-react";

// Comprehensive email validation schema
const emailSchema = z.string()
  .trim()
  .min(5, { message: "Email must be at least 5 characters" })
  .max(255, { message: "Email must be less than 255 characters" })
  .email({ message: "Please enter a valid email address" })
  .refine((email) => {
    // Check for valid email format with proper domain
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }, { message: "Invalid email format" })
  .refine((email) => {
    // Ensure no consecutive dots
    return !email.includes('..');
  }, { message: "Email cannot contain consecutive dots" })
  .refine((email) => {
    // Check for valid domain (supports gmail, outlook, yahoo, etc.)
    const domain = email.split('@')[1];
    return domain && domain.length >= 3 && domain.includes('.');
  }, { message: "Please enter a valid email domain" });

const passwordSchema = z.string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(100, { message: "Password must be less than 100 characters" });

const nameSchema = z.string()
  .trim()
  .min(2, { message: "Name must be at least 2 characters" })
  .max(100, { message: "Name must be less than 100 characters" })
  .refine((name) => {
    // Only allow letters, spaces, hyphens, and apostrophes
    return /^[a-zA-Z\s'-]+$/.test(name);
  }, { message: "Name can only contain letters, spaces, hyphens, and apostrophes" });

const Auth = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'student';
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  // Test reCAPTCHA site key (replace with your own in production)
  const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate(role === 'faculty' ? '/faculty-dashboard' : '/student-dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, role]);

  const validateEmail = (email: string): boolean => {
    try {
      emailSchema.parse(email);
      setEmailError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const validatePassword = (password: string): boolean => {
    try {
      passwordSchema.parse(password);
      setPasswordError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPasswordError(error.errors[0].message);
      }
      return false;
    }
  };

  const validateName = (name: string): boolean => {
    try {
      nameSchema.parse(name);
      setNameError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setNameError(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    setNameError("");

    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isNameValid = validateName(fullName);
    
    if (!isEmailValid || !isPasswordValid || !isNameValid) {
      return;
    }

    // Check CAPTCHA
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
      
      // Reset CAPTCHA
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      // Reset CAPTCHA on error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");

    // Validate fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    // Check CAPTCHA
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      // Reset CAPTCHA on error
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    // Clear form fields and errors when switching tabs
    setEmail("");
    setPassword("");
    setFullName("");
    setEmailError("");
    setPasswordError("");
    setNameError("");
    setCaptchaToken(null);
    recaptchaRef.current?.reset();
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      
      <Card className="w-full max-w-md card-hover relative z-10">
        <CardHeader className="space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold gradient-text mb-2">EduManage</h1>
          </div>
          <CardTitle className="text-3xl text-center">
            {role === 'faculty' ? 'Faculty' : 'Student'} Portal
          </CardTitle>
          <CardDescription className="text-center">
            Sign in or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className={emailError ? "border-destructive" : ""}
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supports Gmail, Outlook, Yahoo, and other email providers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    className={passwordError ? "border-destructive" : ""}
                    required
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                
                {/* CAPTCHA */}
                <div className="flex justify-center py-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                    theme="light"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span>Protected by reCAPTCHA for security</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !captchaToken}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError("");
                    }}
                    onBlur={(e) => validateName(e.target.value)}
                    className={nameError ? "border-destructive" : ""}
                    required
                  />
                  {nameError && (
                    <p className="text-sm text-destructive">{nameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className={emailError ? "border-destructive" : ""}
                    required
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Supports Gmail, Outlook, Yahoo, and other email providers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError("");
                    }}
                    onBlur={(e) => validatePassword(e.target.value)}
                    className={passwordError ? "border-destructive" : ""}
                    required
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                
                {/* CAPTCHA */}
                <div className="flex justify-center py-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                    theme="light"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Shield className="w-4 h-4" />
                  <span>Protected by reCAPTCHA for security</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !captchaToken}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Back to Role Selection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
