# Direct MongoDB Update Commands

## Update specific user by email to UK:
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { 
    $set: { 
      country: {
        code: "GB",
        name: "United Kingdom", 
        currency: "GBP",
        symbol: "£"
      }
    }
  }
)
```

## Update all users with UK in email to UK:
```javascript
db.users.updateMany(
  { email: { $regex: /uk|gb|\.uk/i } },
  { 
    $set: { 
      country: {
        code: "GB",
        name: "United Kingdom",
        currency: "GBP", 
        symbol: "£"
      }
    }
  }
)
```

## Check current country distribution:
```javascript
db.users.aggregate([
  {
    $group: {
      _id: "$country.code",
      count: { $sum: 1 },
      countryName: { $first: "$country.name" }
    }
  }
])
```

## Find users without proper country data:
```javascript
db.users.find({
  $or: [
    { country: { $exists: false } },
    { "country.code": { $exists: false } }
  ]
})
```
