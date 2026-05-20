import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import api from '@/api/client';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data?.data || res.data || []);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleActive = async (user: any) => {
    const newStatus = !user.is_active;
    Alert.alert(
      'Xác nhận',
      `Bạn muốn ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${user.email}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: async () => {
            try {
              await api.patch(`/users/${user.id}/status`, { is_active: newStatus });
              Alert.alert('Thành công', 'Đã cập nhật trạng thái tài khoản');
              fetchUsers();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật trạng thái');
            }
          }
        }
      ]
    );
  };

  const handleChangeRole = async (role: string) => {
    if (!selectedUser) return;
    try {
      await api.patch(`/users/${selectedUser.id}/role`, { role });
      Alert.alert('Thành công', `Đã cập nhật quyền thành ${role}`);
      setShowRoleModal(false);
      fetchUsers();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật quyền');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 px-4 py-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CC0D00" />}
      >
        <Text className="font-bold text-gray-900 text-lg mb-4">Danh sách ({users.length})</Text>
        
        {users.map((user, index) => (
          <Animated.View 
            key={user.id} 
            entering={FadeInDown.delay(index * 50).duration(400)}
            className="bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <View className="flex-row items-center mb-1">
                <Text className="font-bold text-gray-900 text-base flex-shrink" numberOfLines={1}>{user.full_name}</Text>
                {user.role === 'admin' && (
                  <View className="bg-red-100 px-2 py-0.5 rounded-md ml-2">
                     <Text className="text-red-700 text-[10px] font-bold">ADMIN</Text>
                  </View>
                )}
                {user.role === 'storekeeper' && (
                  <View className="bg-orange-100 px-2 py-0.5 rounded-md ml-2">
                     <Text className="text-orange-700 text-[10px] font-bold">THỦ KHO</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-500 text-sm mb-1">{user.email}</Text>
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full mr-1 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                <Text className="text-xs text-gray-400">
                  {user.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Pressable 
                onPress={() => {
                  setSelectedUser(user);
                  setShowRoleModal(true);
                }}
                className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-2"
              >
                <Feather name="shield" size={18} color="#007AFF" />
              </Pressable>
              
              <Pressable 
                onPress={() => handleToggleActive(user)}
                className={`w-10 h-10 rounded-full items-center justify-center ${user.is_active ? 'bg-red-50' : 'bg-green-50'}`}
              >
                <Feather name={user.is_active ? 'lock' : 'unlock'} size={18} color={user.is_active ? '#FF3B30' : '#34C759'} />
              </Pressable>
            </View>
          </Animated.View>
        ))}
        <View className="h-20" />
      </ScrollView>

      {/* Role Selection Modal */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center px-6">
          <View className="bg-white rounded-3xl p-6 shadow-2xl">
            <Text className="text-xl font-bold text-gray-900 mb-2">Đổi quyền hạn</Text>
            <Text className="text-gray-500 mb-6">Cập nhật quyền cho {selectedUser?.email}</Text>

            <Pressable 
              onPress={() => handleChangeRole('admin')}
              className="p-4 bg-gray-50 rounded-xl mb-3 flex-row items-center"
            >
              <Feather name="shield" size={20} color="#CC0D00" className="mr-3" />
              <View className="ml-3">
                <Text className="font-bold text-gray-900">Quản trị viên (Admin)</Text>
                <Text className="text-xs text-gray-500 mt-1">Toàn quyền hệ thống</Text>
              </View>
            </Pressable>

            <Pressable 
              onPress={() => handleChangeRole('storekeeper')}
              className="p-4 bg-gray-50 rounded-xl mb-3 flex-row items-center"
            >
              <Feather name="briefcase" size={20} color="#FF9500" className="mr-3" />
              <View className="ml-3">
                <Text className="font-bold text-gray-900">Thủ kho (Storekeeper)</Text>
                <Text className="text-xs text-gray-500 mt-1">Quản lý thiết bị, mượn trả</Text>
              </View>
            </Pressable>

            <Pressable 
              onPress={() => handleChangeRole('borrower')}
              className="p-4 bg-gray-50 rounded-xl mb-6 flex-row items-center"
            >
              <Feather name="user" size={20} color="#007AFF" className="mr-3" />
              <View className="ml-3">
                <Text className="font-bold text-gray-900">Sinh viên (Borrower)</Text>
                <Text className="text-xs text-gray-500 mt-1">Người dùng mượn thiết bị</Text>
              </View>
            </Pressable>

            <Pressable 
              onPress={() => setShowRoleModal(false)}
              className="bg-gray-200 p-4 rounded-xl items-center"
            >
              <Text className="font-bold text-gray-700">Hủy</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
