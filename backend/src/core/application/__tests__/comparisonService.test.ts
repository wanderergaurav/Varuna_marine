import { ComparisonService } from '../comparisonService';
import { RoutesRepository } from '../../ports/repositories';
import { Route } from '../../domain/models';

describe('ComparisonService', () => {
  const mockRoutes: Route[] = [
    {
      id: 1,
      routeId: 'R001',
      vesselType: 'Container',
      fuelType: 'HFO',
      year: 2024,
      ghgIntensity: 91.0,
      fuelConsumption: 5000,
      distance: 12000,
      totalEmissions: 4500,
      isBaseline: true
    },
    {
      id: 2,
      routeId: 'R002',
      vesselType: 'BulkCarrier',
      fuelType: 'LNG',
      year: 2024,
      ghgIntensity: 88.0,
      fuelConsumption: 4800,
      distance: 11500,
      totalEmissions: 4200,
      isBaseline: false
    },
    {
      id: 3,
      routeId: 'R003',
      vesselType: 'Tanker',
      fuelType: 'MGO',
      year: 2024,
      ghgIntensity: 93.5,
      fuelConsumption: 5100,
      distance: 12500,
      totalEmissions: 4700,
      isBaseline: false
    }
  ];

  let mockRoutesRepository: jest.Mocked<RoutesRepository>;
  let comparisonService: ComparisonService;

  beforeEach(() => {
    mockRoutesRepository = {
      listRoutes: jest.fn().mockResolvedValue(mockRoutes),
      setBaseline: jest.fn()
    };
    comparisonService = new ComparisonService(mockRoutesRepository);
  });

  it('should calculate comparison correctly', async () => {
    const result = await comparisonService.execute();

    expect(result).toHaveLength(3);
    
    // Check baseline route
    expect(result[0]).toMatchObject({
      routeId: 'R001',
      ghgIntensity: 91.0,
      percentDiff: 0,
      compliant: false
    });

    // Check better performing route
    expect(result[1]).toMatchObject({
      routeId: 'R002',
      ghgIntensity: 88.0,
      percentDiff: expect.closeTo(-3.3, 1),
      compliant: true
    });

    // Check worse performing route
    expect(result[2]).toMatchObject({
      routeId: 'R003',
      ghgIntensity: 93.5,
      percentDiff: expect.closeTo(2.75, 1),
      compliant: false
    });
  });

  it('should use target intensity of 89.3368 for compliance', async () => {
    const result = await comparisonService.execute();
    const TARGET_INTENSITY = 89.3368;

    result.forEach(comparison => {
      expect(comparison.compliant).toBe(comparison.ghgIntensity < TARGET_INTENSITY);
    });
  });

  it('should call routesRepository.listRoutes', async () => {
    await comparisonService.execute();
    expect(mockRoutesRepository.listRoutes).toHaveBeenCalledTimes(1);
  });
});
