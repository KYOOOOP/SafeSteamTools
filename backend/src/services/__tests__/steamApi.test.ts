import axios from 'axios';
import { steamApiService } from '../steamApi';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SteamApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return profile data for valid Steam ID', async () => {
      const mockProfile = {
        steamid: '76561198000000000',
        personaname: 'TestUser',
        avatarfull: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
        communityvisibilitystate: 3,
        profilestate: 1,
        realname: 'Test User',
        loccountrycode: 'US',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            players: [mockProfile]
          }
        }
      });

      const result = await steamApiService.getProfile('76561198000000000');
      
      expect(result).toEqual(mockProfile);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/ISteamUser/GetPlayerSummaries/v0002/',
        expect.objectContaining({
          params: {
            key: expect.any(String),
            steamids: '76561198000000000'
          }
        })
      );
    });

    it('should throw error for private profile', async () => {
      const mockProfile = {
        steamid: '76561198000000000',
        personaname: 'PrivateUser',
        communityvisibilitystate: 1, // Private
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            players: [mockProfile]
          }
        }
      });

      await expect(steamApiService.getProfile('76561198000000000'))
        .rejects
        .toThrow('Steam profile is private');
    });

    it('should throw error when profile not found', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            players: []
          }
        }
      });

      await expect(steamApiService.getProfile('76561198000000000'))
        .rejects
        .toThrow('Steam profile not found');
    });
  });

  describe('getOwnedGames', () => {
    it('should return games list for valid Steam ID', async () => {
      const mockGames = [
        {
          appid: 730,
          name: 'Counter-Strike 2',
          playtime_forever: 1000,
          img_icon_url: 'icon',
          img_logo_url: 'logo'
        }
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          response: {
            games: mockGames
          }
        }
      });

      const result = await steamApiService.getOwnedGames('76561198000000000');
      
      expect(result).toEqual(mockGames);
    });

    it('should return empty array when games are private', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          response: {}
        }
      });

      const result = await steamApiService.getOwnedGames('76561198000000000');
      
      expect(result).toEqual([]);
    });
  });

  describe('getInventory', () => {
    it('should return inventory data', async () => {
      const mockInventory = {
        assets: [{ assetid: '123', classid: '456', instanceid: '789', amount: '1' }],
        descriptions: [{ classid: '456', instanceid: '789', name: 'Test Item' }]
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockInventory
      });

      const result = await steamApiService.getInventory('76561198000000000', 730);
      
      expect(result).toEqual(mockInventory);
    });

    it('should return empty inventory when private', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Private inventory'));

      const result = await steamApiService.getInventory('76561198000000000', 730);
      
      expect(result).toEqual({
        assets: [],
        descriptions: []
      });
    });
  });
});