import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CollectionService } from './collection.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../../environments/environment';

describe('CollectionService', () => {
  let service: CollectionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CollectionService]
    });
    service = TestBed.inject(CollectionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch collections', () => {
    const mockResponse = { collections: [{ _id: '1', name: 'Fav', recipes: [] }] };
    
    service.getCollections().subscribe(res => {
      expect(res.collections.length).toBe(1);
      expect(res.collections[0].name).toBe('Fav');
    });

    const req = httpMock.expectOne(req => req.url === \/collections);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should add recipe to collection', () => {
    const mockCol = { _id: '1', name: 'Fav', recipes: ['r1'] };
    
    service.addRecipeToCollection('1', 'r1').subscribe(res => {
      expect(res.recipes.length).toBe(1);
    });

    const req = httpMock.expectOne(\/collections/1/recipes);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ recipeId: 'r1' });
    req.flush(mockCol);
  });

  it('should remove recipe from collection', () => {
    service.removeRecipeFromCollection('1', 'r1').subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(\/collections/1/recipes/r1);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('should delete a collection', () => {
    service.deleteCollection('1').subscribe(res => {
      expect(res.message).toBe('Deleted');
    });

    const req = httpMock.expectOne(\/collections/1);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Deleted' });
  });
});
