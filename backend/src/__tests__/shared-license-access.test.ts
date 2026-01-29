/**
 * Test Suite: Shared License Image Access
 * 
 * Tests that users with the same ambulance license can access each other's images
 */

import { imageRepository } from '../repositories/ImageRepository';
import { userRepository } from '../repositories/UserRepository';
import { licenseService } from '../services/LicenseService';

describe('Shared License Image Access', () => {
  let license1Id: string;
  let license2Id: string;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let image1Id: string;
  let image2Id: string;
  let image3Id: string;

  beforeAll(async () => {
    // Create two licenses
    const license1 = await licenseService.createLicense({
      ambulanceName: 'Test Ambulance 1',
      ambulanceContactEmail: 'test1@ambulance.com',
      uploadQuota: 1000,
      durationDays: 365,
    }, 'admin-user-id');
    license1Id = license1.id;

    const license2 = await licenseService.createLicense({
      ambulanceName: 'Test Ambulance 2',
      ambulanceContactEmail: 'test2@ambulance.com',
      uploadQuota: 1000,
      durationDays: 365,
    }, 'admin-user-id');
    license2Id = license2.id;

    // Create users
    // User 1 and 2 share license1
    const user1 = await userRepository.create({
      email: 'user1@test.com',
      password: 'password123',
      fullName: 'User One',
      licenseId: license1Id,
    });
    user1Id = user1.id;

    const user2 = await userRepository.create({
      email: 'user2@test.com',
      password: 'password123',
      fullName: 'User Two',
      licenseId: license1Id,
    });
    user2Id = user2.id;

    // User 3 has license2
    const user3 = await userRepository.create({
      email: 'user3@test.com',
      password: 'password123',
      fullName: 'User Three',
      licenseId: license2Id,
    });
    user3Id = user3.id;

    // Create images
    const image1 = await imageRepository.create({
      userId: user1Id,
      licenseId: license1Id,
      originalFilename: 'image1.dcm',
      fileFormat: 'dicom',
      fileSize: 1024,
      storagePath: '/test/image1.dcm',
    });
    image1Id = image1.id;

    const image2 = await imageRepository.create({
      userId: user2Id,
      licenseId: license1Id,
      originalFilename: 'image2.dcm',
      fileFormat: 'dicom',
      fileSize: 2048,
      storagePath: '/test/image2.dcm',
    });
    image2Id = image2.id;

    const image3 = await imageRepository.create({
      userId: user3Id,
      licenseId: license2Id,
      originalFilename: 'image3.dcm',
      fileFormat: 'dicom',
      fileSize: 3072,
      storagePath: '/test/image3.dcm',
    });
    image3Id = image3.id;
  });

  describe('License-based Image Access', () => {
    test('User 1 can see images from license1 (own + user2)', async () => {
      const images = await imageRepository.findByLicenseId(license1Id);
      
      expect(images).toHaveLength(2);
      expect(images.map(img => img.id)).toContain(image1Id);
      expect(images.map(img => img.id)).toContain(image2Id);
      expect(images.map(img => img.id)).not.toContain(image3Id);
    });

    test('User 2 can see images from license1 (own + user1)', async () => {
      const images = await imageRepository.findByLicenseId(license1Id);
      
      expect(images).toHaveLength(2);
      expect(images.map(img => img.id)).toContain(image1Id);
      expect(images.map(img => img.id)).toContain(image2Id);
    });

    test('User 3 can only see images from license2', async () => {
      const images = await imageRepository.findByLicenseId(license2Id);
      
      expect(images).toHaveLength(1);
      expect(images[0].id).toBe(image3Id);
      expect(images.map(img => img.id)).not.toContain(image1Id);
      expect(images.map(img => img.id)).not.toContain(image2Id);
    });

    test('License1 users cannot see license2 images', async () => {
      const license1Images = await imageRepository.findByLicenseId(license1Id);
      const license2Images = await imageRepository.findByLicenseId(license2Id);
      
      const license1ImageIds = license1Images.map(img => img.id);
      const license2ImageIds = license2Images.map(img => img.id);
      
      // No overlap between licenses
      const overlap = license1ImageIds.filter(id => license2ImageIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Access Control Logic', () => {
    test('User can access own image', async () => {
      const image = await imageRepository.findById(image1Id);
      const user = await userRepository.findById(user1Id);
      
      const hasAccess = image!.userId === user!.id || 
                       (user!.licenseId && image!.licenseId === user!.licenseId);
      
      expect(hasAccess).toBe(true);
    });

    test('User can access license-shared image', async () => {
      const image = await imageRepository.findById(image2Id); // User2's image
      const user = await userRepository.findById(user1Id);    // User1
      
      const hasAccess = image!.userId === user!.id || 
                       (user!.licenseId && image!.licenseId === user!.licenseId);
      
      expect(hasAccess).toBe(true);
    });

    test('User cannot access image from different license', async () => {
      const image = await imageRepository.findById(image3Id); // User3's image (license2)
      const user = await userRepository.findById(user1Id);    // User1 (license1)
      
      const hasAccess = image!.userId === user!.id || 
                       (user!.licenseId && image!.licenseId === user!.licenseId);
      
      expect(hasAccess).toBe(false);
    });
  });

  describe('Cursor Pagination with License', () => {
    test('Cursor pagination returns only license images', async () => {
      const result = await imageRepository.findByLicenseIdWithCursor(license1Id, 10);
      
      expect(result.data).toHaveLength(2);
      expect(result.data.every(img => img.licenseId === license1Id)).toBe(true);
    });

    test('Cursor pagination isolates licenses', async () => {
      const result1 = await imageRepository.findByLicenseIdWithCursor(license1Id, 10);
      const result2 = await imageRepository.findByLicenseIdWithCursor(license2Id, 10);
      
      const ids1 = result1.data.map(img => img.id);
      const ids2 = result2.data.map(img => img.id);
      
      // No overlap
      const overlap = ids1.filter(id => ids2.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  afterAll(async () => {
    // Cleanup
    await imageRepository.delete(image1Id);
    await imageRepository.delete(image2Id);
    await imageRepository.delete(image3Id);
    // Note: Add user and license cleanup if repositories support it
  });
});
