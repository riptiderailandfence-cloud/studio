"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Key, 
  LogOut, 
  Bell, 
  Save,
  Camera,
  Loader2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, setDocumentNonBlocking, initiateSignOut, useAuth, useMemoFirebase } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";

export default function ProfilePage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const profileRef = useMemoFirebase(() => {
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
      });
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || "",
      }));
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const dataToSave = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (profile) {
        updateDocumentNonBlocking(userRef, dataToSave);
      } else {
        // Initial profile creation
        setDocumentNonBlocking(userRef, {
          ...dataToSave,
          uid: user.uid,
          tenantId: 'tenant_1', // Default tenant for now
          role: 'Owner',
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile changes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    initiateSignOut(auth);
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.displayName || "User");
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  const getJoinedDate = () => {
    if (!profile?.createdAt) return 'Recently';
    try {
      // Handle Firestore Timestamp
      const d = typeof profile.createdAt.toDate === 'function' 
        ? profile.createdAt.toDate() 
        : (profile.createdAt.seconds ? new Date(profile.createdAt.seconds * 1000) : new Date(profile.createdAt));
      
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">Manage your personal account settings and security.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Avatar & Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200`} />
                    <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Badge variant="secondary" className="px-4 py-1">
                  {profile?.role || "Business Owner"}
                </Badge>
              </div>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>{profile?.role === 'Owner' ? 'Full Access Permissions' : 'Limited Access'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>Joined {getJoinedDate()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:bg-destructive/10 border-destructive/20 gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Detailed Forms */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your name and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName} 
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  disabled
                />
                <p className="text-[10px] text-muted-foreground">Email is managed via authentication settings.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary/10 px-6 py-4 flex justify-end">
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Key className="h-3 w-3" />
                <span>Password must be at least 8 characters long and include numbers.</span>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary/10 px-6 py-4 flex justify-end">
              <Button variant="outline" className="gap-2">Update Password</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Control which alerts you receive via email.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> New Estimate Accepted
                  </Label>
                  <p className="text-xs text-muted-foreground">Receive an email when a client signs a quote.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Deposit Received
                  </Label>
                  <p className="text-xs text-muted-foreground">Receive notification when a deposit payment is successful.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Weekly Performance Summary
                  </Label>
                  <p className="text-xs text-muted-foreground">Get a Monday morning report on business KPIs.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
