import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../color/colors';

/**
 * Alert Modal component for confirmations and notifications
 * @param {Object} props - Modal props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Function to close modal
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {string} props.iconName - Ionicons icon name
 * @param {string} props.iconColor - Icon color
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {Function} props.onConfirm - Function when confirm is pressed
 * @param {string} props.confirmButtonColor - Confirm button color
 */
export const AlertModal = ({
  visible,
  onClose,
  title,
  message,
  iconName = 'help-circle',
  iconColor = COLORS.primary,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmButtonColor = COLORS.primary,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 30,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
          maxWidth: 400,
          width: '100%',
        }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#F5F5F5',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <Ionicons name={iconName} size={30} color={iconColor} />
          </View>
          
          <Text style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: COLORS.text,
            textAlign: 'center',
            marginBottom: 10
          }}>
            {title}
          </Text>
          
          <Text style={{
            fontSize: 16,
            color: COLORS.textLight,
            textAlign: 'center',
            marginBottom: 30,
            lineHeight: 22
          }}>
            {message}
          </Text>
          
          <View style={{
            flexDirection: 'row',
            gap: 15,
            width: '100%'
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                borderRadius: 12,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
              onPress={onClose}
            >
              <Text style={{
                color: COLORS.text,
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: confirmButtonColor,
                borderRadius: 12,
                paddingVertical: 12,
              }}
              onPress={() => {
                onClose();
                onConfirm();
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Success Alert component
 */
export const SuccessAlert = ({ visible, onClose, title, message, onConfirm }) => {
  return (
    <AlertModal
      visible={visible}
      onClose={onClose}
      title={title || 'Success'}
      message={message}
      iconName="checkmark-circle"
      iconColor="#4CAF50"
      confirmText="OK"
      cancelText=""
      onConfirm={onConfirm || onClose}
      confirmButtonColor="#4CAF50"
    />
  );
};

/**
 * Error Alert component
 */
export const ErrorAlert = ({ visible, onClose, title, message, onConfirm }) => {
  return (
    <AlertModal
      visible={visible}
      onClose={onClose}
      title={title || 'Error'}
      message={message}
      iconName="alert-circle"
      iconColor={COLORS.expense}
      confirmText="OK"
      cancelText=""
      onConfirm={onConfirm || onClose}
      confirmButtonColor={COLORS.expense}
    />
  );
};

/**
 * Warning Alert component
 */
export const WarningAlert = ({ visible, onClose, title, message, onConfirm, onCancel }) => {
  return (
    <AlertModal
      visible={visible}
      onClose={onClose}
      title={title || 'Warning'}
      message={message}
      iconName="warning"
      iconColor="#FF9800"
      confirmText="Continue"
      cancelText="Cancel"
      onConfirm={onConfirm}
      confirmButtonColor="#FF9800"
    />
  );
};

/**
 * Info Alert component
 */
export const InfoAlert = ({ visible, onClose, title, message, onConfirm }) => {
  return (
    <AlertModal
      visible={visible}
      onClose={onClose}
      title={title || 'Information'}
      message={message}
      iconName="information-circle"
      iconColor={COLORS.primary}
      confirmText="OK"
      cancelText=""
      onConfirm={onConfirm || onClose}
      confirmButtonColor={COLORS.primary}
    />
  );
};
