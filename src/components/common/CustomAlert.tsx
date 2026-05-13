import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAlertStore } from '@/store/useAlertStore';

const { width } = Dimensions.get('window');

const CustomAlert = () => {
  const { visible, type, title, message, onConfirm, showCancel, hideAlert } = useAlertStore();

  const getIcon = () => {
    switch (type) {
      case 'success': return { name: 'check-circle', color: '#34C759', bg: '#E8F9EE' };
      case 'error': return { name: 'alert-circle', color: '#FF3B30', bg: '#FFF1F0' };
      case 'warning': return { name: 'alert-triangle', color: '#FF9500', bg: '#FFF8E6' };
      default: return { name: 'info', color: '#007AFF', bg: '#EBF5FF' };
    }
  };

  const icon = getIcon();

  const handleConfirm = () => {
    // Hide immediately first
    hideAlert();
    
    // Use a safe delay to ensure modal is dismissed before triggering navigation/logout
    if (onConfirm) {
      setTimeout(() => {
        onConfirm();
      }, 350); // Slightly more than typical modal animation duration
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      statusBarTranslucent={true}
      onRequestClose={hideAlert}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={hideAlert} />
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
            <Feather name={icon.name as any} size={32} color={icon.color} />
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {showCancel && (
              <Pressable 
                style={[styles.button, styles.cancelButton]} 
                onPress={hideAlert}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Pressable>
            )}
            <Pressable 
              style={[styles.button, styles.confirmButton, { backgroundColor: type === 'error' ? '#FF3B30' : '#CC0D00' }]} 
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Xác nhận</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 24,
    width: Math.min(width - 48, 340),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    shadowColor: '#CC0D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomAlert;
