# Horizontal Editor - Current Status & Next Steps

## ✅ What's Working
1. **Both Fields and Available Editors are horizontal** ✅
2. **Headers showing** with column names ✅  
3. **Runtime overrides working** - getRuntimeOverrides correctly identifies BBField and BBEditor ✅
4. **Debug width display enabled** - showing 100-1000 under each field ✅

## ❌ Outstanding Issues

### 1. **Flickering Still Happening**
- Changed tracking from `$index` to `getFieldKey(field)` 
- OnPush change detection already set
- **May need additional fix from transcript** - the transcript mentioned font normalization and removing manual font settings

### 2. **All Fields Show Same Width (100-1000)**
**Root Cause**: BBField type definition is missing field-level settings

**Need to add to BBField.fields** (in core-types.ts or wherever BBField is defined):
```typescript
fields: [
  { 
    FieldID: 'Prompt', 
    TypeID: 'String',
    Prompt: 'Prompt',
    settings: {
      'String.MinVisible': 20,
      'String.MaxLen': 20
    }
  },
  { 
    FieldID: 'TypeID', 
    TypeID: 'String',
    Prompt: 'TypeID',
    settings: {
      'String.MinVisible': 20,
      'String.MaxLen': 20
    }
  },
  { 
    FieldID: 'FieldID', 
    TypeID: 'String',
    Prompt: 'FieldID',
    settings: {
      'String.MinVisible': 20,
      'String.MaxLen': 20
    }
  },
  { 
    FieldID: 'Required', 
    TypeID: 'Boolean',
    Prompt: 'Required'
  },
  { 
    FieldID: 'Group', 
    TypeID: 'Number',
    Prompt: 'Group',
    settings: {
      'Number.AllowNegative': false,
      'Number.AllowDecimals': false,
      'Number.MaxValue': 99
    }
  },
  { 
    FieldID: 'Description', 
    TypeID: 'String',
    Prompt: 'Description',
    settings: {
      'String.MinVisible': 5,
      'String.MaxLen': 150
    }
  }
]
```

### 3. **BBEditor.type Field Issue**
- Should use Type.Kind enum, currently renders as text input
- Low priority - logged in TODO.md

## 🔍 Where to Find BBField Definition

Need to search for where BBField struct type is created. It might be:
1. Dynamically generated from BBTypeService
2. In a separate types file
3. Created in initialization code

**Search locations:**
- services/bb-type.service.ts
- Any init/bootstrap files
- core-types.ts (search for "struct" type creation)

## 📋 Immediate Actions Needed

1. **Find BBField definition** - search codebase for where BBField fields array is defined
2. **Add field-level settings** as shown above
3. **Debug flickering** - may need to check font settings or add additional tracking stability
4. **Test after changes** - verify widths update correctly

## 🎯 Expected Result After Fixes

Fields should show different widths:
- Prompt: ~145px (20 chars * 7.25px)
- TypeID: ~145px  
- FieldID: ~145px
- Group: ~70px (2-digit number)
- Description: Can grow to fill space (MinVisible=5, MaxLen=150)
