import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import api from '@/api/client';
import { Alert } from '@/utils/alert';
import { StatusBar } from 'expo-status-bar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleApiError } from '@/utils/error-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const roleMap: Record<string, { text: string; color: string; bg: string }> = {
  admin: { text: 'Quản trị viên', color: '#DC2626', bg: '#FEE2E2' },
  storekeeper: { text: 'Quản lý kho', color: '#2563EB', bg: '#DBEAFE' },
  borrower: { text: 'Người mượn', color: '#059669', bg: '#D1FAE5' },
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'storekeeper' | 'borrower'>('borrower');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error(error);
      handleApiError(error, 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('borrower');
    setModalVisible(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setFullName(user.full_name);
    setUsername(user.username);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ Họ tên, Username, Email');
      return;
    }
    if (!editingUser && !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu cho tài khoản mới');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Edit User
        await api.put(`/users/${editingUser.id}`, {
          full_name: fullName.trim(),
          email: email.trim(),
          role: role,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thành công', 'Đã cập nhật thông tin tài khoản');
      } else {
        // Add User
        await api.post('/users', {
          full_name: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          password: password.trim(),
          role: role,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thành công', 'Đã tạo tài khoản mới');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      handleApiError(error, 'Lỗi khi lưu tài khoản');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = (user: any) => {
    const actionText = user.is_active ? 'Khóa' : 'Kích hoạt';
    Alert.alert(
      'Xác nhận thay đổi',
      `Bạn có muốn ${actionText.toLowerCase()} tài khoản này không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: actionText,
          style: user.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Thành công', `Đã ${actionText.toLowerCase()} tài khoản`);
              fetchUsers();
            } catch (error) {
              handleApiError(error, 'Không thể cập nhật trạng thái tài khoản');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((u: any) => {
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 border-b border-gray-100 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
          <Feather name="arrow-left" size={20} color="#333" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Quản lý Tài khoản</Text>
        <Pressable onPress={handleOpenAdd} className="w-10 h-10 items-center justify-center rounded-full bg-red-50">
          <Feather name="plus" size={20} color="#CC0D00" />
        </Pressable>
      </View>

      {/* Search bar */}
      <View className="p-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-50 px-4 rounded-xl border border-gray-100">
          <Feather name="search" size={16} color="#999" />
          <Input
            placeholder="Tìm theo họ tên, username, email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm text-gray-900 py-3"
            style={{ borderBottomWidth: 0 }}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} />}
        renderItem={({ item, index }) => {
          const role = roleMap[item.role] || { text: item.role, color: '#4B5563', bg: '#F3F4F6' };
          return (
            <Animated.View
              entering={FadeInDown.delay(index * 40).duration(400)}
              className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-4">
                <View className="flex-row items-center flex-wrap">
                  <Text className="font-bold text-gray-900 text-base mr-2">{item.full_name}</Text>
                  <View 
                    style={{ backgroundColor: role.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}
                  >
                    <Text style={{ color: role.color, fontSize: 10, fontWeight: 'bold' }}>{role.text}</Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Username: <Text className="font-semibold">{item.username}</Text></Text>
                <Text className="text-gray-400 text-xs mt-0.5">Email: {item.email}</Text>
                
                {/* Penalty points display */}
                {item.penalty_points > 0 && (
                  <View className="flex-row items-center mt-2">
                    <Feather name="alert-circle" size={12} color="#DC2626" />
                    <Text className="text-[11px] text-red-600 font-bold ml-1">Bị phạt: {item.penalty_points} điểm</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center">
                {/* Lock/Unlock Toggle */}
                <Pressable
                  onPress={() => handleToggleStatus(item)}
                  style={{ backgroundColor: item.is_active ? '#ECFDF5' : '#FEF2F2', width: 36, height: 36 }}
                  className="rounded-full items-center justify-center mr-2"
                >
                  <Feather 
                    name={item.is_active ? 'unlock' : 'lock'} 
                    size={16} 
                    color={item.is_active ? '#10B981' : '#EF4444'} 
                  />
                </Pressable>

                {/* Edit details */}
                <Pressable
                  onPress={() => handleOpenEdit(item)}
                  className="bg-gray-50 w-36 h-36 rounded-full items-center justify-center"
                  style={{ width: 36, height: 36 }}
                >
                  <Feather name="edit-2" size={16} color="#4B5563" />
                </Pressable>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Feather name="users" size={48} color="#eee" />
            <Text className="text-gray-400 mt-4 text-medium">Không tìm thấy tài khoản nào</Text>
          </View>
        }
      />

      {/* Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[30px] p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">{editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</Text>
              <Pressable onPress={() => setModalVisible(false)} className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center">
                <Feather name="x" size={18} color="#999" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Họ và tên</Text>
                <Input
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Tên đăng nhập (Username)</Text>
                <Input
                  placeholder="Ví dụ: nguyenvana"
                  value={username}
                  onChangeText={setUsername}
                  editable={!editingUser}
                  style={{ backgroundColor: editingUser ? '#F3F4F6' : '#fff' }}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Email</Text>
                <Input
                  placeholder="Ví dụ: a.nv@student.ptit.edu.vn"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>

              {!editingUser && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Mật khẩu</Text>
                  <Input
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              )}

              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Vai trò hệ thống</Text>
                <View className="flex-row justify-between">
                  {(['borrower', 'storekeeper', 'admin'] as const).map((r) => {
                    const isSelected = role === r;
                    const label = r === 'admin' ? 'Quản trị viên' : r === 'storekeeper' ? 'Thủ kho' : 'Người mượn';
                    return (
                      <Pressable
                        key={r}
                        onPress={() => setRole(r)}
                        className={`flex-1 mx-1 py-3 rounded-xl items-center border ${
                          isSelected ? 'bg-red-50 border-primary' : 'bg-white border-gray-200'
                        }`}
                      >
                        <Text className={`font-semibold text-xs ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Button
                title={editingUser ? 'Cập nhật' : 'Tạo mới'}
                onPress={handleSubmit}
                loading={submitting}
                className="mb-8"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
