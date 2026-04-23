import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, ScrollView, ActivityIndicator, TextInput, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, updateUserRole, updateProfile, logoutUser } from '../../storage/mockDB';

const C = {
  bg:       '#E8D5B7',
  bgBottom: '#C9A87C',
  card:     '#F5ECD8',
  border:   '#C4A882',
  brown:    '#7A4E2D',
  brownMid: '#A0714F',
  blue:     '#2E5F8A',
  cream:    '#FDF6EC',
  dark:     '#2C1A0E',
  muted:    '#8A6A4A',
  white:    '#FFFFFF',
  danger:   '#A03020',
};

// ─── Edit Modal ───────────────────────────────────────────────
function EditModal({ visible, user, onClose, onSave }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (visible) {
      setFullName(user?.fullName ?? '');
      setPhone(user?.phone ?? '');
    }
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ fullName, phone });
    setSaving(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <Text style={m.title}>Edit info</Text>
          <Text style={m.label}>Full Name</Text>
          <TextInput style={m.input} value={fullName} onChangeText={setFullName} placeholderTextColor={C.muted} autoCapitalize="words" />
          <Text style={m.label}>Phone</Text>
          <TextInput style={m.input} value={phone} onChangeText={setPhone} placeholderTextColor={C.muted} keyboardType="phone-pad" />
          <Text style={m.label}>Email</Text>
          <View style={m.inputDisabled}><Text style={{ color: C.muted, fontSize: 14 }}>{user?.email}</Text></View>
          <Text style={m.hint}>Email cannot be changed</Text>
          <View style={m.btnRow}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose}><Text style={{ color: C.brown, fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={C.white} /> : <Text style={{ color: C.white, fontWeight: 'bold' }}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { getCurrentUser().then(u => setUser(u)); }, []);

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 2500);
  };

  const handleSwitchRole = async () => {
    if (!user || roleLoading) return;
    setRoleLoading(true);
    try {
      const newRole = user.role === 'seller' ? 'buyer' : 'seller';
      const updated = await updateUserRole(newRole);
      setUser(updated);
      showMsg(`Switched to ${newRole}`);
    } catch { showMsg('Could not update role', 'error'); }
    finally { setRoleLoading(false); }
  };

  const handleSaveProfile = async (fields) => {
    try {
      const updated = await updateProfile(fields);
      setUser(updated);
      setEditVisible(false);
      showMsg('Profile updated!');
    } catch {
      showMsg('Could not save profile', 'error');
      setEditVisible(false);
    }
  };

  const isSeller = user?.role === 'seller';
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <LinearGradient colors={[C.bg, C.bgBottom]} style={s.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => router.back()}><Text style={s.backArrow}>←</Text></TouchableOpacity>
            <Text style={s.topTitle}>Profile</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={s.hero}>
            <View style={s.avatarWrap}>
              <View style={s.avatar}><Text style={s.initials}>{initials}</Text></View>
              <TouchableOpacity style={s.cameraBtn}><Text style={{ fontSize: 12 }}>📷</Text></TouchableOpacity>
            </View>
            <Text style={s.name}>{user?.fullName ?? '—'}</Text>
            <Text style={s.email}>{user?.email ?? ''}</Text>
            <View style={[s.badge, isSeller && s.badgeSeller]}>
              <Text style={[s.badgeText, isSeller && s.badgeTextSeller]}>
                {isSeller ? '🏪  Seller' : '🛍️  Buyer'}
              </Text>
            </View>
          </View>

          {msg.text ? <Text style={[s.msg, msg.type === 'error' && s.msgError]}>{msg.text}</Text> : null}

          <Text style={s.section}>My Account</Text>
         
<View style={s.card}>
  <Row icon="✏️" label="Edit info" sub="Update name & phone" onPress={() => setEditVisible(true)} />
  <Div />
  <Row icon="📦" label="My commands" sub="View history" onPress={() => router.push('/screens/commands')} />
  
  {/* ONLY SHOW DASHBOARD IF SELLER */}
  {isSeller && (
    <>
      <Div />
      <Row 
        icon="📊" 
        label="Seller Dashboard" 
        sub="View your stats" 
        onPress={() => router.push('/screens/dashboard')} 
      />
    </>
  )}
  
  <Div />
  <Row
    icon="💼"
    label={isSeller ? 'Switch to buyer' : 'Switch to seller'}
    sub={isSeller ? 'Tap to become a buyer' : 'Tap to become a seller'}
    onPress={handleSwitchRole}
    loading={roleLoading}
  />
</View>

          <Text style={s.section}>Preferences</Text>
<View style={s.card}>
  <View style={s.row}>
    <View style={s.rowLeft}>
      <Text style={s.rowIcon}>🔔</Text>
      <Text style={s.rowLabel}>Notifications</Text>
    </View>
    <Switch 
      value={notifications} 
      onValueChange={setNotifications} 
      trackColor={{ false: C.border, true: C.blue }} 
      thumbColor={notifications ? C.white : C.cream} 
    />
  </View>
  <Div />
  <View style={s.row}>
    <View style={s.rowLeft}>
      <Text style={s.rowIcon}>🌙</Text>
      <Text style={s.rowLabel}>Night mode</Text>
    </View>
    <Switch 
      value={nightMode} 
      onValueChange={setNightMode} 
      trackColor={{ false: C.border, true: C.blue }} 
      thumbColor={nightMode ? C.white : C.cream} 
    />
  </View>
</View>

          <TouchableOpacity style={s.disconnectBtn} onPress={async () => { await logoutUser(); router.replace('/'); }}>
            <Text style={s.disconnectText}>⇥  Disconnect</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <EditModal visible={editVisible} user={user} onClose={() => setEditVisible(false)} onSave={handleSaveProfile} />
    </LinearGradient>
  );
}

// ─── Helpers & Styles ─────────────────────────────────────────
function Row({ icon, label, sub, onPress, loading }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}><Text style={s.rowLabel}>{label}</Text>{sub ? <Text style={s.rowSub}>{sub}</Text> : null}</View>
      {loading ? <ActivityIndicator size="small" color={C.blue} /> : <Text style={s.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function Div() { return <View style={{ height: 1, backgroundColor: C.border, marginHorizontal: 14 }} />; }

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  backArrow: { color: C.brown, fontSize: 22 },
  topTitle: { color: C.dark, fontSize: 16, fontWeight: 'bold' },
  hero: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { marginBottom: 10 },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.brown, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.cream, elevation: 6 },
  initials: { color: C.cream, fontSize: 28, fontWeight: 'bold' },
  cameraBtn: { position: 'absolute', bottom: -4, right: -4, backgroundColor: C.cream, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, padding: 4 },
  name: { color: C.dark, fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  email: { color: C.muted, fontSize: 13, marginTop: 3, marginBottom: 10 },
  badge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(122,78,45,0.1)', borderWidth: 1, borderColor: C.brownMid },
  badgeSeller: { backgroundColor: 'rgba(46,95,138,0.1)', borderColor: C.blue },
  badgeText: { color: C.brown, fontSize: 13, fontWeight: '600' },
  badgeTextSeller: { color: C.blue },
  msg: { color: C.blue, fontSize: 13, textAlign: 'center', backgroundColor: 'rgba(46,95,138,0.1)', padding: 8, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(46,95,138,0.2)' },
  msgError: { color: C.danger, backgroundColor: 'rgba(160,48,32,0.08)', borderColor: 'rgba(160,48,32,0.2)' },
  section: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 2, marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  rowIcon: { fontSize: 18, marginRight: 12 },
  rowLabel: { color: C.dark, fontSize: 14, fontWeight: '600' },
  rowSub: { color: C.muted, fontSize: 12, marginTop: 1 },
  chevron: { color: C.brownMid, fontSize: 18 },
  disconnectBtn: { borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(160,48,32,0.35)', paddingVertical: 13, alignItems: 'center', marginTop: 4, backgroundColor: 'rgba(160,48,32,0.06)' },
  disconnectText: { color: C.danger, fontSize: 15, fontWeight: 'bold' },
 row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', // This pushes the switch to the end
    paddingHorizontal: 14, 
    paddingVertical: 13 
  },
  
  rowLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  rowIcon: { fontSize: 18, marginRight: 12 },
  rowLabel: { color: C.dark, fontSize: 14, fontWeight: '600' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(44,26,14,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.cream, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, borderColor: C.border, padding: 22, paddingBottom: 36 },
  title: { color: C.dark, fontSize: 17, fontWeight: 'bold', marginBottom: 18 },
  label: { color: C.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 },
  input: { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 10, color: C.dark, fontSize: 14, marginBottom: 14 },
  inputDisabled: { backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 4 },
  hint: { color: C.muted, fontSize: 11, marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 11, borderRadius: 20, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 11, borderRadius: 20, backgroundColor: C.brown, alignItems: 'center' },
});