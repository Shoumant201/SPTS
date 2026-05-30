import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { routeApi, Route } from '../../services/api/routes';

interface RoutesScreenProps {
  onRouteSelect?: (route: Route) => void;
}

const RoutesScreen: React.FC<RoutesScreenProps> = ({ onRouteSelect }) => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'distance'>('name');

  useEffect(() => {
    fetchRoutes();
  }, [sortBy]);

  useEffect(() => {
    filterRoutes();
  }, [searchQuery, routes]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await routeApi.getAllRoutes({ sortBy });
      setRoutes(response.routes);
      setFilteredRoutes(response.routes);
    } catch (error: any) {
      console.error('Failed to fetch routes:', error);
      Alert.alert('Error', 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const filterRoutes = () => {
    if (!searchQuery.trim()) {
      setFilteredRoutes(routes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = routes.filter(
      (route) =>
        route.name.toLowerCase().includes(query) ||
        route.routeNumber?.toLowerCase().includes(query) ||
        route.startPoint.toLowerCase().includes(query) ||
        route.endPoint.toLowerCase().includes(query) ||
        route.stops.some((stop) => stop.name.toLowerCase().includes(query))
    );
    setFilteredRoutes(filtered);
  };

  const handleRoutePress = (route: Route) => {
    if (onRouteSelect) {
      onRouteSelect(route);
    } else {
      Alert.alert(
        route.name,
        `From: ${route.startPoint}\nTo: ${route.endPoint}\nPrice: Rs. ${route.basePrice}\nDistance: ${route.distance} km`
      );
    }
  };

  const RouteCard = ({ route }: { route: Route }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => handleRoutePress(route)}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeNumberContainer}>
          <Text style={styles.routeNumber}>
            {route.routeNumber || route.name.substring(0, 3).toUpperCase()}
          </Text>
        </View>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routePoints}>
            {route.startPoint} → {route.endPoint}
          </Text>
        </View>
      </View>

      <View style={styles.routeDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📏</Text>
          <Text style={styles.detailText}>{route.distance} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>💰</Text>
          <Text style={styles.detailText}>Rs. {route.basePrice}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>🚏</Text>
          <Text style={styles.detailText}>{route.stops.length} stops</Text>
        </View>
        {route._count?.assignments && route._count.assignments > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🚌</Text>
            <Text style={styles.detailText}>{route._count.assignments} active</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes or destinations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
              Price
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
            onPress={() => setSortBy('distance')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'distance' && styles.sortButtonTextActive]}>
              Distance
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Routes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      ) : filteredRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🚌</Text>
          <Text style={styles.emptyText}>No routes found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'No routes available at the moment'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredRoutes.length} {filteredRoutes.length === 1 ? 'route' : 'routes'} found
            </Text>
          </View>
          {filteredRoutes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    paddingLeft: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  sortButtonActive: {
    backgroundColor: '#007AFF',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  routesList: {
    flex: 1,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  routeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  routePoints: {
    fontSize: 13,
    color: '#666',
  },
  routeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

export default RoutesScreen;
