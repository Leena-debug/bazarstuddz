import { View, TextInput, StyleSheet } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'


export default function CustomInput({value, setValue, placeholder, secureTextEntry, icon}) {
  return (
    <View style={styles.container}>
     <Ionicons name={icon} size={20} color="#999" style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        style={styles.input}
        value={value}
        onChangeText={text => setValue(text)}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#999"
      />
    </View>
  )
}

const styles = StyleSheet.create({
 container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#6b6060ba',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
})