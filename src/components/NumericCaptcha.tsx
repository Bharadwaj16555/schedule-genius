import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NumericCaptchaProps {
  onVerify: (isValid: boolean) => void;
}

const NumericCaptcha = ({ onVerify }: NumericCaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [error, setError] = useState("");

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer("");
    setError("");
    onVerify(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleChange = (value: string) => {
    setUserAnswer(value);
    setError("");
    
    if (value) {
      const answer = parseInt(value);
      const correctAnswer = num1 + num2;
      
      if (answer === correctAnswer) {
        onVerify(true);
        setError("");
      } else if (value.length >= correctAnswer.toString().length) {
        setError("Incorrect answer. Please try again.");
        onVerify(false);
      }
    } else {
      onVerify(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/20">
      <div className="flex items-center justify-between">
        <Label htmlFor="captcha" className="text-sm font-medium">
          Security Verification
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={generateCaptcha}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-primary/10 to-accent/10 p-4 rounded-lg border-2 border-dashed border-primary/30">
          <span className="text-3xl font-bold gradient-text">{num1}</span>
          <span className="text-2xl font-bold text-muted-foreground">+</span>
          <span className="text-3xl font-bold gradient-text">{num2}</span>
          <span className="text-2xl font-bold text-muted-foreground">=</span>
          <span className="text-2xl font-bold text-muted-foreground">?</span>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          id="captcha"
          type="number"
          placeholder="Enter the answer"
          value={userAnswer}
          onChange={(e) => handleChange(e.target.value)}
          className={error ? "border-destructive" : userAnswer && !error ? "border-green-500" : ""}
          required
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {userAnswer && !error && parseInt(userAnswer) === num1 + num2 && (
          <p className="text-sm text-green-600">✓ Verification successful</p>
        )}
      </div>
    </div>
  );
};

export default NumericCaptcha;
