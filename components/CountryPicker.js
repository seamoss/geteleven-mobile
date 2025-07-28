import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
  SafeAreaView
} from 'react-native'

const CountryPicker = ({
  countries,
  selectedCountry,
  onSelect,
  placeholder = 'Select your country'
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [searchText, setSearchText] = useState('')

  const countryList = Object.keys(countries).map(code => ({
    code,
    ...countries[code]
  }))

  const filteredCountries = countryList.filter(
    country =>
      country.primary.toLowerCase().includes(searchText.toLowerCase()) ||
      country.secondary.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleSelect = countryCode => {
    onSelect(countryCode)
    setIsVisible(false)
    setSearchText('')
  }

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleSelect(item.code)}
    >
      <Text style={styles.countryName}>{item.primary}</Text>
      <Text style={styles.countryCode}>{item.secondary}</Text>
    </TouchableOpacity>
  )

  return (
    <>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.pickerButtonText}>
          {selectedCountry
            ? countries[selectedCountry]?.secondary
            : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsVisible(false)
                setSearchText('')
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Country</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder='Search countries...'
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={item => item.code}
            style={styles.countryList}
          />
        </SafeAreaView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  pickerButton: {
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 100
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#020617',
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  closeButton: {
    padding: 4
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748b'
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#020617'
  },
  headerSpacer: {
    width: 60 // Balance the close button
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  searchInput: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#f8fafc'
  },
  countryList: {
    flex: 1
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  countryName: {
    fontSize: 16,
    color: '#020617',
    flex: 1
  },
  countryCode: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500'
  }
})

export default CountryPicker
