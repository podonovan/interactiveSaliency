class UserDisplay(object):
	def __init__(self,userID,IPs,nQueries,nStats,sinceFirst,sinceLast,locations=[]):
		self.userID = userID
		self.IPs = IPs
		self.nQueries = nQueries
		self.nStats = nStats
		self.sinceFirst = sinceFirst
		self.sinceLast = sinceLast
		self.locations = locations

	def to_dict(self):
		pass