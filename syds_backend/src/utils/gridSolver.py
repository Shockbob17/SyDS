from collections import deque

class gridSolver:
    def __init__(self, grid):
        """
        Initializes the grid solver

        Args:
            grid (list[list[int]]): The grid configuration of any given floor
            The python thinks the following ints corresponds to the following objects
            0: Empty space
            1: Tenant
            2: Bin
            3: Wall
        """
        print(grid)
        self.grid = grid
        self.tenants = self._findTenants()
        self.bins = self._findBins()
        self.routes = self.findTenantRoutes()

    def _findBins(self):
        indexes = self._findGridItem(2)
        print("Bins at: " + str(indexes))
        return indexes

    def _findTenants(self):
        indexes = self._findGridItem(1)
        print("Tenants at: " + str(indexes))
        return indexes

    def _findGridItem(self, int):
        items =[]
        for (col, i) in enumerate(self.grid):
            for (row, index) in enumerate(i):
                if index == int:
                    items.append((row, col))
        return items
    
    def _bfs(self, start):
        """Finds the shortest path from start (tenant) to the nearest bin using BFS"""
        queue = deque([(start, [start])])  # (current_position, path)
        visited = set()
        visited.add(start)

        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]  # Left, Right, Up, Down

        while queue:
            (x, y), path = queue.popleft()

            # If we reach a bin, return the path
            if (x, y) in self.bins:
                return path

            # Explore all 4 directions
            for dx, dy in directions:
                new_x, new_y = x + dx, y + dy

                if (0 <= new_x < len(self.grid[0]) and 
                    0 <= new_y < len(self.grid) and 
                    self.grid[new_y][new_x] != 3 and  # Not a wall
                    (new_x, new_y) not in visited):

                    queue.append(((new_x, new_y), path + [(new_x, new_y)]))
                    visited.add((new_x, new_y))

        return []  # No path found

    def findTenantRoutes(self):
        """
        Finds the shortest route from each tenant to the nearest bin.
        Returns:
            dict: {tenant_position: shortest_path_to_bin}
        """
        tenant_routes = {}
        for tenant in self.tenants:
            path = self._bfs(tenant)
            tenant_routes[tenant] = path
        # print(tenant_routes)
        return {str(list(k)): v for k, v in tenant_routes.items()}  # Convert keys to lists




if __name__ == "__main__":
    pass