using AuthService.Domain.Entities;
using AuthService.Domain.Interfaces;
using AuthService.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace AuthService.Persistence.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _context;
    public RefreshTokenRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<RefreshToken?> GetByHashAsync(string tokenHash)
    {
        return await _context.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash);
    }

    public async Task<IEnumerable<RefreshToken>> GetByFamilyIdAsync(Guid familyId)
    {
        return await _context.RefreshTokens.Where(r => r.FamilyId == familyId).ToListAsync();
    }

    public async Task AddAsync(RefreshToken token)
    {
        await _context.RefreshTokens.AddAsync(token);
    }

    public Task RevokeAsync(RefreshToken token)
    {
        token.RevokedAt = DateTime.UtcNow;
        _context.RefreshTokens.Update(token);
        return Task.CompletedTask;
    }

    public async Task RevokeFamilyAsync(Guid familyId)
    {
        var tokens = await GetByFamilyIdAsync(familyId);
        foreach (var token in tokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }
        _context.RefreshTokens.UpdateRange(tokens);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
